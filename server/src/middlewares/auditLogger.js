const AuditLog = require('../models/AuditLog');

/**
 * Log system, security, or election lifecycle events into AuditLog collection
 */
const logAuditEvent = async ({
  req,
  action,
  actorId = null,
  actorRole = 'ANONYMOUS',
  status = 'SUCCESS',
  details = {},
}) => {
  try {
    const ipAddress =
      req?.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      'UNKNOWN';
    const userAgent = req?.headers['user-agent'] || 'UNKNOWN';

    const finalActorId = actorId || req?.user?._id || null;
    const finalActorRole = actorRole !== 'ANONYMOUS' ? actorRole : (req?.user?.role || 'ANONYMOUS');

    await AuditLog.create({
      action,
      actorId: finalActorId,
      actorRole: finalActorRole,
      ipAddress,
      userAgent,
      status,
      details,
      timestamp: new Date(),
    });
  } catch (err) {
    // Non-blocking: Audit log failure shouldn't crash main transaction, but log error
    console.error(`[AuditLog Error] Failed to write audit event ${action}:`, err.message);
  }
};

module.exports = {
  logAuditEvent,
};

