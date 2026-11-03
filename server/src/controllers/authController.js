const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const FraudAlert = require('../models/FraudAlert');
const VoteRecord = require('../models/VoteRecord');
const { generateOtp, hashOtp } = require('../utils/hashUtils');
const { sendEmail } = require('../config/mailer');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { logAuditEvent } = require('../middlewares/auditLogger');
const { extractFaceEmbedding } = require('../services/mlClientService');

/**
 * Generate Access and Refresh JWT Tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role, status: user.status },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

/**
 * POST /api/v1/auth/register
 * Register voter with name, email, voterId, password, and webcam face photo
 */
const register = async (req, res, next) => {
  try {
    const { name, email, voterId, password, faceImage } = req.body;

    // Check if voter already exists
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { voterId: voterId.toUpperCase() }],
    });

    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'email' : 'Voter ID';
      return errorResponse(res, {
        statusCode: 409,
        message: `An account with this ${field} already exists.`,
        code: 'USER_EXISTS',
      });
    }

    // Biometric face embedding extraction via ML microservice
    let faceEmbedding = [];
    if (faceImage) {
      try {
        const mlRes = await extractFaceEmbedding(faceImage);
        faceEmbedding = mlRes.embedding || [];
      } catch (mlErr) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Biometric capture rejected: ${mlErr.message}. Ensure your face is centered and clearly lit.`,
          code: 'BIOMETRIC_FAILED',
        });
      }
    }

    // Generate 6-digit OTP for email verification
    const rawOtp = generateOtp();
    const otpHash = hashOtp(rawOtp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await User.create({
      name,
      email,
      voterId,
      password,
      role: 'voter',
      status: 'pending', // Pending official KYC review
      faceEmbedding,
      faceImageUrl: faceImage || null,
      isEmailVerified: false,
      otp: {
        code: otpHash,
        expiresAt: otpExpires,
      },
    });

    // Send email with OTP
    try {
      await sendEmail({
        to: newUser.email,
        subject: 'Verify Your Identity - AI Secure Online Voting System',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Verify Your Voter Account</h2>
            <p>Dear ${newUser.name},</p>
            <p>Thank you for registering on the AI Secure Online Voting Platform. Use the one-time verification code below to verify your email address:</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e3a8a; text-align: center; margin: 20px 0;">
              ${rawOtp}
            </div>
            <p>This code will expire in 10 minutes. If you did not initiate this request, please disregard this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <small style="color: #64748b;">AI Secure Online Voting System • Cryptographic & Biometric Governance</small>
          </div>
        `,
        text: `Your AI Voting verification code is: ${rawOtp}. Valid for 10 minutes.`,
      });
    } catch (mailErr) {
      console.warn('[Mailer Warning] Could not deliver email directly:', mailErr.message);
    }

    await logAuditEvent({
      req,
      action: 'VOTER_REGISTERED',
      actorId: newUser._id,
      actorRole: 'voter',
      status: 'SUCCESS',
      details: { email: newUser.email, voterId: newUser.voterId },
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Registration successful! Please check your email for the 6-digit verification code.',
      data: {
        userId: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/verify-otp
 * Verify 6-digit email OTP
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp.code +otp.expiresAt');
    if (!user) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'No account found with this email address.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.isEmailVerified) {
      return successResponse(res, {
        message: 'Email is already verified. You can log in.',
      });
    }

    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'No active OTP verification session found. Please request a new code.',
        code: 'OTP_EXPIRED',
      });
    }

    if (new Date() > user.otp.expiresAt) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'The verification code has expired. Please request a new code.',
        code: 'OTP_EXPIRED',
      });
    }

    const hashedInput = hashOtp(otp.trim());
    if (hashedInput !== user.otp.code) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Invalid verification code. Please check and try again.',
        code: 'INVALID_OTP',
      });
    }

    // Mark email verified and clear OTP
    user.isEmailVerified = true;
    user.otp = undefined;
    await user.save();

    await logAuditEvent({
      req,
      action: 'EMAIL_VERIFIED',
      actorId: user._id,
      actorRole: user.role,
      status: 'SUCCESS',
      details: { email: user.email },
    });

    return successResponse(res, {
      message: 'Email address verified successfully. Your registration is now awaiting election official review.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/resend-otp
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Account not found with this email.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.isEmailVerified) {
      return successResponse(res, { message: 'Email is already verified.' });
    }

    const rawOtp = generateOtp();
    user.otp = {
      code: hashOtp(rawOtp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your New Verification Code - AI Secure Online Voting',
      html: `<h3>Your new code is: <strong>${rawOtp}</strong></h3><p>Valid for 10 minutes.</p>`,
      text: `Your new verification code is: ${rawOtp}`,
    });

    return successResponse(res, {
      message: 'A fresh verification code has been dispatched to your email.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticate voter or admin
 */
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or voterId
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { voterId: identifier.toUpperCase() };

    const user = await User.findOne(query).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid credentials. Please verify your email/voter ID and password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check account lockout
    if (user.isLocked()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return errorResponse(res, {
        statusCode: 423,
        message: `Account is temporarily locked due to excessive failed attempts. Try again in ${waitMinutes} minute(s).`,
        code: 'ACCOUNT_LOCKED',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }
      await user.save();

      await logAuditEvent({
        req,
        action: 'LOGIN_FAILED',
        actorId: user._id,
        actorRole: user.role,
        status: 'WARNING',
        details: { identifier, attempts: user.loginAttempts },
      });

      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid credentials. Please verify your email/voter ID and password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Reset failed attempts on success
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = {
      ip: req.ip || req.headers['x-forwarded-for'] || 'UNKNOWN',
      userAgent: req.headers['user-agent'] || 'UNKNOWN',
      timestamp: new Date(),
    };

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    // Set HTTP-Only Cookie for Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await logAuditEvent({
      req,
      action: 'LOGIN_SUCCESS',
      actorId: user._id,
      actorRole: user.role,
      status: 'SUCCESS',
      details: { role: user.role },
    });

    return successResponse(res, {
      message: 'Authentication successful.',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          voterId: user.voterId,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          hasFaceRegistered: !!(user.faceEmbedding && user.faceEmbedding.length > 0),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Refresh token missing.',
        code: 'REFRESH_TOKEN_MISSING',
      });
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Invalid or revoked refresh token.',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, {
      message: 'Access token refreshed.',
      data: { accessToken },
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Expired or invalid refresh token.',
      code: 'REFRESH_TOKEN_EXPIRED',
    });
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }
    res.clearCookie('refreshToken');
    return successResponse(res, { message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, {
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
        status: user.status,
        rejectionReason: user.rejectionReason,
        isEmailVerified: user.isEmailVerified,
        faceImageUrl: user.faceImageUrl,
        hasFaceRegistered: !!(user.faceEmbedding && user.faceEmbedding.length > 0),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/auth/me
 * Self-service voter account & biometric data deletion
 */
const deleteMyAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const voter = await User.findById(userId);
    if (!voter) {
      return errorResponse(res, { statusCode: 404, message: 'Account not found.' });
    }

    if (voter.role === 'admin') {
      return errorResponse(res, { statusCode: 403, message: 'Admin accounts cannot be self-deleted.' });
    }

    // Clean up associated voter data
    await FraudAlert.deleteMany({ userId });
    await VoteRecord.deleteMany({ voterId: userId });
    await User.findByIdAndDelete(userId);

    await logAuditEvent({
      req,
      action: 'VOTER_ACCOUNT_SELF_DELETED',
      actorId: userId,
      actorRole: 'voter',
      status: 'SUCCESS',
      details: { email: voter.email, name: voter.name },
    });

    return successResponse(res, {
      message: 'Your voter registration and biometric profile have been permanently deleted.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refreshToken,
  logout,
  getMe,
  deleteMyAccount,
};

