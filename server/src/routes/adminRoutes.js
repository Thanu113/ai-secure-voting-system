const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getDashboardStats,
  getVoters,
  updateVoterStatus,
  deleteVoter,
  getFraudAlerts,
  resolveFraudAlert,
  auditElectionLedger,
  getAuditLogs,
} = require('../controllers/adminController');

const {
  createElection,
  updateElectionStatus,
} = require('../controllers/electionController');

const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');

// Enforce admin role on all routes in this file
router.use(authenticate, authorize('admin'));

// Dashboard Stats & Analytics
router.get('/dashboard-stats', getDashboardStats);

// Voter KYC Management
router.get('/voters', getVoters);
router.delete('/voters/:id', deleteVoter);
router.patch(
  '/voters/:id/status',
  validate([
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  ]),
  updateVoterStatus
);

// Election Operations
router.post(
  '/elections',
  validate([
    body('title').trim().notEmpty().withMessage('Election title is required'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('candidates').isArray({ min: 2 }).withMessage('At least two candidates required'),
  ]),
  createElection
);
router.patch('/elections/:id/status', updateElectionStatus);

// Blockchain Hash Chain Ledger Audit
router.get('/elections/:id/audit-ledger', auditElectionLedger);

// Fraud & Behavioral Anomaly Alerts
router.get('/fraud-alerts', getFraudAlerts);
router.patch('/fraud-alerts/:id', resolveFraudAlert);

// Tamper-Evident Audit Logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;

