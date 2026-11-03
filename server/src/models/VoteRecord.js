const mongoose = require('mongoose');

const voteRecordSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true,
      index: true,
    },
    receiptHash: {
      type: String,
      required: true,
      index: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// One-person-one-vote compound unique index
// Guarantees at database storage engine level that duplicate ballots are rejected
voteRecordSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

const VoteRecord = mongoose.model('VoteRecord', voteRecordSchema);
module.exports = VoteRecord;

