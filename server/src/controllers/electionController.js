const Election = require('../models/Election');
const VoteRecord = require('../models/VoteRecord');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logAuditEvent } = require('../middlewares/auditLogger');

/**
 * GET /api/v1/elections
 * List all elections with optional status filter. Attaches hasVoted flag if user is a voter.
 */
const getElections = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    // Voters should only see active or closed elections, not drafts
    if (req.user && req.user.role === 'voter') {
      filter.status = { $in: ['active', 'closed'] };
    }

    const elections = await Election.find(filter).sort({ startDate: -1 });

    // If logged in as voter, check which elections they've voted in
    let votedElectionIds = new Set();
    if (req.user && req.user.role === 'voter') {
      const records = await VoteRecord.find({ voterId: req.user._id }).select('electionId');
      votedElectionIds = new Set(records.map((r) => r.electionId.toString()));
    }

    const data = elections.map((elec) => {
      const obj = elec.toObject();
      obj.hasVoted = votedElectionIds.has(elec._id.toString());
      // Hide individual vote counts until closed unless admin
      if (req.user?.role !== 'admin' && elec.status !== 'closed') {
        obj.candidates = obj.candidates.map((c) => ({
          candidateId: c.candidateId,
          name: c.name,
          party: c.party,
          photoUrl: c.photoUrl,
          manifesto: c.manifesto,
        }));
      }
      return obj;
    });

    return successResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/elections/:id
 */
const getElectionById = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return errorResponse(res, { statusCode: 404, message: 'Election not found.' });
    }

    let hasVoted = false;
    let userReceiptHash = null;
    if (req.user && req.user.role === 'voter') {
      const record = await VoteRecord.findOne({ voterId: req.user._id, electionId: election._id });
      if (record) {
        hasVoted = true;
        userReceiptHash = record.receiptHash;
      }
    }

    const obj = election.toObject();
    obj.hasVoted = hasVoted;
    obj.userReceiptHash = userReceiptHash;

    if (req.user?.role !== 'admin' && election.status !== 'closed') {
      obj.candidates = obj.candidates.map((c) => ({
        candidateId: c.candidateId,
        name: c.name,
        party: c.party,
        photoUrl: c.photoUrl,
        manifesto: c.manifesto,
      }));
    }

    return successResponse(res, { data: obj });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/elections/:id/results
 * Official results and candidate tallies (Accessible when election is closed or by admin)
 */
const getElectionResults = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return errorResponse(res, { statusCode: 404, message: 'Election not found.' });
    }

    if (election.status !== 'closed' && req.user?.role !== 'admin') {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Election results remain sealed until voting is officially closed.',
      });
    }

    const totalVotes = election.totalVotesCast || 0;
    const candidatesWithPercentages = election.candidates.map((c) => {
      const percentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(2) : 0;
      return {
        candidateId: c.candidateId,
        name: c.name,
        party: c.party,
        photoUrl: c.photoUrl,
        voteCount: c.voteCount,
        percentage: Number(percentage),
      };
    });

    // Sort by vote count descending
    candidatesWithPercentages.sort((a, b) => b.voteCount - a.voteCount);

    const winner = candidatesWithPercentages.length > 0 && totalVotes > 0 ? candidatesWithPercentages[0] : null;

    return successResponse(res, {
      data: {
        electionId: election._id,
        title: election.title,
        status: election.status,
        startDate: election.startDate,
        endDate: election.endDate,
        totalVotesCast: totalVotes,
        winner,
        candidates: candidatesWithPercentages,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/elections
 * (Admin Only) Create a new election
 */
const createElection = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate, candidates } = req.body;

    const election = await Election.create({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      candidates,
      createdBy: req.user._id,
      status: 'draft',
    });

    await logAuditEvent({
      req,
      action: 'ELECTION_CREATED',
      actorId: req.user._id,
      actorRole: 'admin',
      status: 'SUCCESS',
      details: { electionId: election._id, title: election.title },
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Election created successfully in draft mode.',
      data: election,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/elections/:id/status
 * (Admin Only) Change election lifecycle state: draft -> active -> closed
 */
const updateElectionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['draft', 'active', 'closed'].includes(status)) {
      return errorResponse(res, { statusCode: 400, message: 'Invalid status transition.' });
    }

    const election = await Election.findById(id);
    if (!election) {
      return errorResponse(res, { statusCode: 404, message: 'Election not found.' });
    }

    const oldStatus = election.status;
    election.status = status;
    await election.save();

    await logAuditEvent({
      req,
      action: 'ELECTION_STATUS_CHANGED',
      actorId: req.user._id,
      actorRole: 'admin',
      status: 'SUCCESS',
      details: { electionId: election._id, oldStatus, newStatus: status },
    });

    return successResponse(res, {
      message: `Election status updated to ${status}.`,
      data: election,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getElections,
  getElectionById,
  getElectionResults,
  createElection,
  updateElectionStatus,
};

