const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  verifyBiometrics,
  castVote,
  checkReceipt,
} = require('../controllers/voteController');

const { authenticate, requireApprovedVoter } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');
const { voteLimiter } = require('../middlewares/rateLimiter');

// Public receipt verification
router.get('/verify-receipt/:receiptHash', checkReceipt);

// Biometric webcam challenge
router.post(
  '/verify-biometrics',
  authenticate,
  requireApprovedVoter,
  [body('liveImage').notEmpty().withMessage('Live webcam image is required')],
  validate([body('liveImage').notEmpty().withMessage('Live webcam image is required')]),
  verifyBiometrics
);

// Cast ballot
router.post(
  '/cast',
  authenticate,
  requireApprovedVoter,
  voteLimiter,
  validate([
    body('electionId').isMongoId().withMessage('Valid electionId is required'),
    body('candidateId').notEmpty().withMessage('Candidate selection is required'),
  ]),
  castVote
);

module.exports = router;

