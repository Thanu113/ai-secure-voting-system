const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  refreshToken,
  logout,
  getMe,
  deleteMyAccount,
} = require('../controllers/authController');

const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

// Registration validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('voterId').trim().notEmpty().withMessage('Government Voter ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// OTP validation rules
const otpValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be a 6-digit number'),
];

// Login validation rules
const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or Voter ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', authLimiter, validate(registerValidation), register);
router.post('/verify-otp', authLimiter, validate(otpValidation), verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.delete('/me', authenticate, deleteMyAccount);

module.exports = router;

