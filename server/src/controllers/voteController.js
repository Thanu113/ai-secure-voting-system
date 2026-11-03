const Election = require('../models/Election');
const VoteRecord = require('../models/VoteRecord');
const FraudAlert = require('../models/FraudAlert');
const User = require('../models/User');
const { generateReceiptHash } = require('../utils/hashUtils');
const { appendBallot, verifyReceipt } = require('../services/ledgerService');
const { verifyFace, checkLiveness, detectAnomaly } = require('../services/mlClientService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logAuditEvent } = require('../middlewares/auditLogger');

/**
 * POST /api/v1/votes/verify-biometrics
 * Step 1 of voting: voter takes webcam photo to verify biometric identity
 */
const verifyBiometrics = async (req, res, next) => {
  try {
    const { liveImage, frames } = req.body;
    const voter = await User.findById(req.user._id);

    if (!voter.faceEmbedding || voter.faceEmbedding.length === 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'No biometric face embedding found in your profile. Please contact election support.',
        code: 'NO_EMBEDDING',
      });
    }

    // 1. Run Liveness Check if multiple frames provided
    let livenessPassed = true;
    if (frames && Array.isArray(frames) && frames.length >= 2) {
      try {
        const livenessRes = await checkLiveness(frames);
        livenessPassed = livenessRes.liveness_passed;
        if (!livenessPassed) {
          await FraudAlert.create({
            userId: voter._id,
            anomalyScore: -0.85,
            isAnomaly: true,
            status: 'FLAGGED',
            reviewNote: 'Biometric Anti-Spoofing Alert: Liveness test failed (no natural eye blink or dynamic facial variance detected).',
          });

          await logAuditEvent({
            req,
            action: 'LIVENESS_CHALLENGE_FAILED',
            actorId: voter._id,
            actorRole: 'voter',
            status: 'WARNING',
            details: { reason: 'No eye blink or dynamic variance detected' },
          });

          return errorResponse(res, {
            statusCode: 403,
            message: 'Liveness anti-spoofing challenge failed. Please blink naturally into the camera.',
            code: 'LIVENESS_FAILED',
          });
        }
      } catch (livenessErr) {
        console.warn('[Liveness Warning]:', livenessErr.message);
      }
    }

    // 2. Run Face Matching
    const matchRes = await verifyFace(liveImage, voter.faceEmbedding);
    if (!matchRes.verified) {
      await FraudAlert.create({
        userId: voter._id,
        anomalyScore: Number((-(matchRes.distance || 0.65)).toFixed(3)),
        isAnomaly: true,
        status: 'FLAGGED',
        reviewNote: `Biometric Impersonation Alert: Face mismatch detected (Distance: ${matchRes.distance?.toFixed(3) || '0.65'} vs Threshold: ${matchRes.threshold || '0.42'}). Live face did not match registered identity.`,
      });

      await logAuditEvent({
        req,
        action: 'FACE_VERIFICATION_FAILED',
        actorId: voter._id,
        actorRole: 'voter',
        status: 'WARNING',
        details: { distance: matchRes.distance, threshold: matchRes.threshold },
      });

      return errorResponse(res, {
        statusCode: 401,
        message: 'Facial identity verification failed. Live face did not match registered identity.',
        code: 'FACE_MISMATCH',
        meta: { distance: matchRes.distance },
      });
    }

    return successResponse(res, {
      message: 'Biometric identity verified successfully.',
      data: {
        verified: true,
        matchScore: matchRes.match_score || (1 - matchRes.distance).toFixed(3),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/votes/cast
 * Step 2 of voting: Cast secret ballot onto blockchain ledger
 */
const castVote = async (req, res, next) => {
  try {
    const { electionId, candidateId, liveImage, frames, telemetry } = req.body;
    const voterId = req.user._id;

    // 1. Verify election exists and is open
    const election = await Election.findById(electionId);
    if (!election) {
      return errorResponse(res, { statusCode: 404, message: 'Election not found.' });
    }

    if (election.status !== 'active') {
      return errorResponse(res, {
        statusCode: 403,
        message: `Election is not currently open for voting (Current status: ${election.status.toUpperCase()}).`,
      });
    }

    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Voting window is currently closed based on scheduled election dates.',
      });
    }

    // 2. Validate candidate choice
    const candidateValid = election.candidates.some((c) => c.candidateId === candidateId);
    if (!candidateValid) {
      return errorResponse(res, { statusCode: 400, message: 'Invalid candidate selection.' });
    }

    // 3. Strict One-Person-One-Vote enforcement check
    const existingVote = await VoteRecord.findOne({ voterId, electionId });
    if (existingVote) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Violation: You have already cast your ballot in this election. Exactly one vote is permitted.',
        code: 'VOTE_ALREADY_CAST',
        meta: { votedAt: existingVote.votedAt },
      });
    }

    // 4. Biometric Re-Verification at the exact moment of casting ballot
    const voter = await User.findById(voterId);
    if (liveImage && voter.faceEmbedding && voter.faceEmbedding.length > 0) {
      try {
        const faceRes = await verifyFace(liveImage, voter.faceEmbedding);
        if (!faceRes.verified) {
          await FraudAlert.create({
            userId: voter._id,
            electionId,
            anomalyScore: Number((-(faceRes.distance || 0.65)).toFixed(3)),
            isAnomaly: true,
            status: 'FLAGGED',
            reviewNote: `Biometric Impersonation Alert at Ballot Seal: Face did not match registered identity (Distance: ${faceRes.distance?.toFixed(3) || '0.65'}).`,
          });

          return errorResponse(res, {
            statusCode: 401,
            message: 'Facial verification failed at ballot casting.',
            code: 'FACE_MISMATCH',
          });
        }
      } catch (faceErr) {
        console.warn('[Face Verification warning during vote]:', faceErr.message);
      }
    }

    // 5. Machine Learning Behavioral Anomaly Detection
    const features = {
      login_frequency_24h: telemetry?.loginFrequency24h || 1,
      ip_change_count: telemetry?.ipChangeCount || 0,
      time_to_vote_seconds: telemetry?.timeToVoteSeconds || 25,
      failed_attempts_ratio: telemetry?.failedAttemptsRatio || 0.0,
      hour_of_day: new Date().getHours(),
    };

    const anomalyResult = await detectAnomaly(features);

    if (anomalyResult.is_anomaly) {
      // Flag suspicious activity for admin audit
      await FraudAlert.create({
        userId: voterId,
        electionId,
        anomalyScore: anomalyResult.anomaly_score,
        isAnomaly: true,
        features: {
          loginFrequency24h: features.login_frequency_24h,
          ipChangeCount: features.ip_change_count,
          timeToVoteSeconds: features.time_to_vote_seconds,
          failedAttemptsRatio: features.failed_attempts_ratio,
          hourOfDay: features.hour_of_day,
        },
        status: 'FLAGGED',
      });

      await logAuditEvent({
        req,
        action: 'FRAUD_ANOMALY_DETECTED',
        actorId: voterId,
        actorRole: 'voter',
        status: 'WARNING',
        details: { anomalyScore: anomalyResult.anomaly_score, features },
      });
    }

    // 6. Generate voter receipt hash and append block to hash-chained ledger
    const receiptHash = generateReceiptHash();

    // Persist anonymous ballot block in ledger
    const ballotBlock = await appendBallot({
      electionId,
      candidateId,
      receiptHash,
    });

    // Mark voter participation in VoteRecord (without candidate choice to protect secret ballot!)
    await VoteRecord.create({
      voterId,
      electionId,
      receiptHash,
      votedAt: new Date(),
    });

    await logAuditEvent({
      req,
      action: 'VOTE_CAST_SUCCESS',
      actorId: voterId,
      actorRole: 'voter',
      status: 'SUCCESS',
      details: {
        electionId,
        blockSequence: ballotBlock.sequenceNumber,
        receiptHash,
      },
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Your vote has been cast and cryptographically sealed on the ledger.',
      data: {
        receiptHash,
        sequenceNumber: ballotBlock.sequenceNumber,
        blockHash: ballotBlock.hash,
        timestamp: ballotBlock.timestamp,
        electionTitle: election.title,
      },
    });
  } catch (err) {
    // If MongoDB duplicate index triggers on VoteRecord
    if (err.code === 11000) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Duplicate vote prevented by database integrity constraint.',
        code: 'VOTE_DUPLICATE_DENIED',
      });
    }
    next(err);
  }
};

/**
 * GET /api/v1/votes/verify-receipt/:receiptHash
 * Public receipt verifier
 */
const checkReceipt = async (req, res, next) => {
  try {
    const { receiptHash } = req.params;
    const record = await verifyReceipt(receiptHash.trim().toUpperCase());

    if (!record) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Receipt hash not found in the cryptographic election ledger.',
        code: 'RECEIPT_NOT_FOUND',
      });
    }

    return successResponse(res, {
      message: 'Receipt verified on immutable ledger.',
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyBiometrics,
  castVote,
  checkReceipt,
};

