const mongoose = require('mongoose');

const ballotSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true,
      index: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    candidateId: {
      type: String,
      required: true,
    },
    receiptHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prevHash: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

ballotSchema.index({ electionId: 1, sequenceNumber: 1 }, { unique: true });

const Ballot = mongoose.model('Ballot', ballotSchema);
module.exports = Ballot;

