const mongoose = require('mongoose');
const crypto = require('crypto');

const candidateSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    default: () => 'cand_' + crypto.randomBytes(6).toString('hex'),
  },
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true,
  },
  party: {
    type: String,
    required: [true, 'Political party / affiliation is required'],
    trim: true,
  },
  photoUrl: {
    type: String,
    default: '',
  },
  manifesto: {
    type: String,
    default: '',
  },
  voteCount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Election title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft',
      index: true,
    },
    candidates: {
      type: [candidateSchema],
      validate: [
        (val) => val.length >= 2,
        'An election must have at least 2 competing candidates',
      ],
    },
    genesisHash: {
      type: String,
      required: true,
      default: () => crypto.createHash('sha256').update('GENESIS_BLOCK_' + Date.now()).digest('hex'),
    },
    totalVotesCast: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to check if election is actively accepting ballots
electionSchema.methods.isOpen = function () {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

const Election = mongoose.model('Election', electionSchema);
module.exports = Election;

