const User = require('../models/User');
const Election = require('../models/Election');
const Ballot = require('../models/Ballot');
const VoteRecord = require('../models/VoteRecord');
const FraudAlert = require('../models/FraudAlert');
const AuditLog = require('../models/AuditLog');
const { verifyElectionLedger } = require('../services/ledgerService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logAuditEvent } = require('../middlewares/auditLogger');

/**
 * GET /api/v1/admin/dashboard-stats
 * Real-time high-level admin metrics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalVoters,
      approvedVoters,
      pendingVoters,
      rejectedVoters,
      totalElections,
      activeElections,
      totalBallots,
      flaggedAlerts,
    ] = await Promise.all([
      User.countDocuments({ role: 'voter' }),
      User.countDocuments({ role: 'voter', status: 'approved' }),
      User.countDocuments({ role: 'voter', status: 'pending' }),
      User.countDocuments({ role: 'voter', status: 'rejected' }),
      Election.countDocuments(),
      Election.countDocuments({ status: 'active' }),
      Ballot.countDocuments(),
      FraudAlert.countDocuments({ status: 'FLAGGED' }),
    ]);

    const turnoutPercentage = approvedVoters > 0 ? ((totalBallots / approvedVoters) * 100).toFixed(1) : 0;

    return successResponse(res, {
      data: {
        voterMetrics: {
          total: totalVoters,
          approved: approvedVoters,
          pending: pendingVoters,
          rejected: rejectedVoters,
        },
        electionMetrics: {
          total: totalElections,
          active: activeElections,
          totalBallots,
          overallTurnoutPercent: Number(turnoutPercentage),
        },
        securityMetrics: {
          flaggedAlerts,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/voters
 * List voter registrations with status filters
 */
const getVoters = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = { role: 'voter' };

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { voterId: { $regex: search, $options: 'i' } },
      ];
    }

    const voters = await User.find(query)
      .select('name email voterId status rejectionReason isEmailVerified faceImageUrl createdAt lastLogin')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    return successResponse(res, {
      data: voters,
      meta: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/voters/:id/status
 * KYC Approval / Rejection
 */
const updateVoterStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return errorResponse(res, { statusCode: 400, message: 'Status must be approved or rejected.' });
    }

    const voter = await User.findById(id);
    if (!voter || voter.role !== 'voter') {
      return errorResponse(res, { statusCode: 404, message: 'Voter not found.' });
    }

    voter.status = status;
    voter.rejectionReason = status === 'rejected' ? rejectionReason || 'Information mismatch' : null;
    await voter.save();

    await logAuditEvent({
      req,
      action: `VOTER_KYC_${status.toUpperCase()}`,
      actorId: req.user._id,
      actorRole: 'admin',
      status: 'SUCCESS',
      details: { voterId: voter._id, voterEmail: voter.email, status, reason: voter.rejectionReason },
    });

    return successResponse(res, {
      message: `Voter KYC registration successfully ${status}.`,
      data: voter,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/fraud-alerts
 */
const getFraudAlerts = async (req, res, next) => {
  try {
    const alerts = await FraudAlert.find()
      .populate('userId', 'name email voterId')
      .populate('electionId', 'title')
      .sort({ createdAt: -1 });

    return successResponse(res, { data: alerts });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/fraud-alerts/:id
 */
const resolveFraudAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!['RESOLVED_ALLOWED', 'RESOLVED_BLOCKED'].includes(status)) {
      return errorResponse(res, { statusCode: 400, message: 'Invalid resolution status.' });
    }

    const alert = await FraudAlert.findById(id);
    if (!alert) {
      return errorResponse(res, { statusCode: 404, message: 'Alert not found.' });
    }

    alert.status = status;
    alert.reviewNote = reviewNote || '';
    alert.reviewedBy = req.user._id;
    await alert.save();

    return successResponse(res, {
      message: `Fraud alert marked as ${status}.`,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/elections/:id/audit-ledger
 * Cryptographic blockchain ledger audit
 */
const auditElectionLedger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const auditReport = await verifyElectionLedger(id);

    await logAuditEvent({
      req,
      action: 'LEDGER_AUDITED',
      actorId: req.user._id,
      actorRole: 'admin',
      status: auditReport.isLedgerTamperFree ? 'SUCCESS' : 'CRITICAL',
      details: auditReport,
    });

    return successResponse(res, {
      message: auditReport.isLedgerTamperFree
        ? 'Ledger cryptographically verified. All SHA-256 blocks and hash chains are authentic and untampered.'
        : 'CRITICAL ALERT: Hash chain mismatch or corrupted ballot blocks detected!',
      data: auditReport,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, status, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (status) filter.status = status;

    const logs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    return successResponse(res, {
      data: logs,
      meta: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/voters/:id
 * Remove voter registration upon request
 */
const deleteVoter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const voter = await User.findById(id);
    if (!voter || voter.role !== 'voter') {
      return errorResponse(res, { statusCode: 404, message: 'Voter not found.' });
    }

    // Clean up associated voter fraud alerts and voting records
    await FraudAlert.deleteMany({ userId: voter._id });
    await VoteRecord.deleteMany({ voterId: voter._id });
    await User.findByIdAndDelete(id);

    await logAuditEvent({
      req,
      action: 'VOTER_REGISTRATION_DELETED',
      actorId: req.user._id,
      actorRole: 'admin',
      status: 'SUCCESS',
      details: { voterId: voter._id, email: voter.email, name: voter.name },
    });

    return successResponse(res, {
      message: `Voter ${voter.name} (${voter.email}) registration was successfully removed.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getVoters,
  updateVoterStatus,
  deleteVoter,
  getFraudAlerts,
  resolveFraudAlert,
  auditElectionLedger,
  getAuditLogs,
};

