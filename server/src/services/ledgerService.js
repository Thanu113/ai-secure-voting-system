const Ballot = require('../models/Ballot');
const Election = require('../models/Election');
const { calculateBlockHash, verifyLedgerChain } = require('../utils/hashUtils');

/**
 * Append a verified ballot anonymously to the election's hash-chained ledger
 */
const appendBallot = async ({ electionId, candidateId, receiptHash }) => {
  const election = await Election.findById(electionId);
  if (!election) {
    throw new Error('Election not found');
  }

  // 1. Find the latest ballot block in this election to obtain prevHash
  const latestBlock = await Ballot.findOne({ electionId })
    .sort({ sequenceNumber: -1 })
    .exec();

  const sequenceNumber = latestBlock ? latestBlock.sequenceNumber + 1 : 1;
  const prevHash = latestBlock ? latestBlock.hash : election.genesisHash;
  const timestamp = new Date();

  // 2. Compute cryptographic block hash
  const hash = calculateBlockHash({
    prevHash,
    electionId,
    candidateId,
    timestamp,
    receiptHash,
  });

  // 3. Persist anonymous ballot block
  const newBallot = await Ballot.create({
    electionId,
    sequenceNumber,
    candidateId,
    receiptHash,
    prevHash,
    hash,
    timestamp,
  });

  // 4. Atomically increment candidate vote count and election total
  await Election.updateOne(
    { _id: electionId, 'candidates.candidateId': candidateId },
    {
      $inc: {
        'candidates.$.voteCount': 1,
        totalVotesCast: 1,
      },
    }
  );

  return newBallot;
};

/**
 * Perform a full cryptographic verification of an election's ledger
 */
const verifyElectionLedger = async (electionId) => {
  const election = await Election.findById(electionId);
  if (!election) {
    throw new Error('Election not found');
  }

  const blocks = await Ballot.find({ electionId })
    .sort({ sequenceNumber: 1 })
    .exec();

  const auditResult = verifyLedgerChain(blocks, election.genesisHash);

  return {
    electionId: election._id,
    electionTitle: election.title,
    genesisHash: election.genesisHash,
    isLedgerTamperFree: auditResult.valid,
    totalBlocksAudited: auditResult.totalBlocks,
    recordedTotalVotes: election.totalVotesCast,
    countsMatch: auditResult.totalBlocks === election.totalVotesCast,
    corruptedBlockIndex: auditResult.corruptedBlockIndex,
    failureReason: auditResult.reason,
    verifiedAt: new Date(),
  };
};

/**
 * Public receipt verifier: verifies that a receipt hash is officially on the ledger
 */
const verifyReceipt = async (receiptHash) => {
  const ballot = await Ballot.findOne({ receiptHash }).populate('electionId', 'title status');
  if (!ballot) {
    return null;
  }

  return {
    verified: true,
    receiptHash: ballot.receiptHash,
    electionTitle: ballot.electionId ? ballot.electionId.title : 'Election',
    electionStatus: ballot.electionId ? ballot.electionId.status : 'unknown',
    sequenceNumber: ballot.sequenceNumber,
    blockHash: ballot.hash,
    prevHash: ballot.prevHash,
    timestamp: ballot.timestamp,
  };
};

module.exports = {
  appendBallot,
  verifyElectionLedger,
  verifyReceipt,
};

