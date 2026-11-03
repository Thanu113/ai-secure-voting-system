const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      index: true,
    },
    anomalyScore: {
      type: Number,
      required: true,
    },
    isAnomaly: {
      type: Boolean,
      required: true,
      default: true,
    },
    features: {
      loginFrequency24h: { type: Number, default: 0 },
      ipChangeCount: { type: Number, default: 0 },
      timeToVoteSeconds: { type: Number, default: 0 },
      failedAttemptsRatio: { type: Number, default: 0 },
      hourOfDay: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['FLAGGED', 'RESOLVED_ALLOWED', 'RESOLVED_BLOCKED'],
      default: 'FLAGGED',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const FraudAlert = mongoose.model('FraudAlert', fraudAlertSchema);
module.exports = FraudAlert;

