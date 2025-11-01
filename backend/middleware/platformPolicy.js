/**
 * Platform policy and rate limiting middleware
 * - Enforces that manual/auto account creation is only allowed for Roblox
 * - Blocks non-Roblox platforms with standardized error
 * - Provides per-IP rate limiting for manual create (20 req/min)
 * - Reads environment-based configuration with safe fallbacks
 */

const ActivityLog = require('../models/ActivityLog');

const DEFAULT_ENABLED_PLATFORMS = ['roblox'];
const RATE_LIMIT_PER_MINUTE = 20;

// In-memory rate limit store: { ip: { count, windowStart } }
const rateStore = new Map();

function parseBoolEnv(val, defaultValue) {
  if (val === undefined || val === null) return defaultValue;
  const v = String(val).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', 'no', 'n'].includes(v)) return false;
  return defaultValue;
}

function getEnabledPlatforms() {
  const raw = process.env.ENABLED_PLATFORMS;
  if (!raw) return DEFAULT_ENABLED_PLATFORMS;
  return raw
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0);
}

function isNonRobloxDisabledForManual() {
  return parseBoolEnv(process.env.DISABLE_MANUAL_CREATE_FOR_NON_ROBLOX, true);
}

function isNonRobloxDisabledForAuto() {
  return parseBoolEnv(process.env.DISABLE_AUTO_CREATE_FOR_NON_ROBLOX, true);
}

function isPlatformEnabled(platform) {
  const enabled = getEnabledPlatforms();
  return enabled.includes(platform.toLowerCase());
}

function blockNonRoblox(res, platform, endpoint, userId, ip, userAgent) {
  // Structured error response
  const message = `Account creation is currently limited to Roblox. Platform '${platform}' is disabled.`;
  // Attempt to log a blocked event
  try {
    ActivityLog.create({
      activityType: endpoint === 'auto' ? 'ACCOUNT_AUTO_CREATE' : 'ACCOUNT_CREATE',
      status: 'FAILURE',
      userId,
      targetEntity: {
        entityType: 'Account',
        entityName: `${platform || 'unknown'}:blocked`,
        platform: platform || 'unknown',
      },
      requestContext: {
        ipAddress: ip,
        userAgent,
        endpoint: endpoint === 'auto' ? '/api/accounts/auto-create' : '/api/accounts/manual-create',
        method: 'POST',
        timestamp: new Date(),
      },
      details: {
        beforeState: null,
        afterState: null,
        metadata: {
          event: 'account.create.blocked',
          reason: 'ACC_PLATFORM_DISABLED',
          enabledPlatforms: getEnabledPlatforms(),
        },
      },
      error: {
        code: 'ACC_PLATFORM_DISABLED',
        message,
      },
    }).catch(() => {});
  } catch (_) {}

  return res.status(400).json({
    code: 'ACC_PLATFORM_DISABLED',
    message,
    details: {
      platform,
      enabledPlatforms: getEnabledPlatforms(),
    },
  });
}

function manualCreateRateLimit(req, res) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  let entry = rateStore.get(ip);
  if (!entry) {
    entry = { count: 0, windowStart: now };
    rateStore.set(ip, entry);
  }

  if (now - entry.windowStart >= windowMs) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_PER_MINUTE) {
    return res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded: max ${RATE_LIMIT_PER_MINUTE} manual create requests per minute.`,
    });
  }

  return null;
}

// Middleware: enforce manual create policy
async function enforceManualCreatePolicy(req, res, next) {
  const platform = (req.body?.platform || '').toLowerCase();
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent');

  // Rate limiting per IP
  const rateError = manualCreateRateLimit(req, res);
  if (rateError) return; // response already sent

  // If env says disable non-roblox, block any non-roblox platform
  if (isNonRobloxDisabledForManual() && platform !== 'roblox') {
    return blockNonRoblox(res, platform || 'unknown', 'manual', req.user?.id, ip, userAgent);
  }

  // If platform not in ENABLED_PLATFORMS, block too (fallback policy)
  if (!isPlatformEnabled(platform)) {
    return blockNonRoblox(res, platform || 'unknown', 'manual', req.user?.id, ip, userAgent);
  }

  // Log attempt
  try {
    await ActivityLog.create({
      activityType: 'ACCOUNT_CREATE',
      status: 'PENDING',
      userId: req.user?.id,
      targetEntity: {
        entityType: 'Account',
        entityName: `${platform || 'unknown'}:${req.body?.username || 'unknown'}`,
        platform: platform || 'unknown',
      },
      requestContext: {
        ipAddress: ip,
        userAgent,
        endpoint: '/api/accounts/manual-create',
        method: 'POST',
        timestamp: new Date(),
      },
      details: {
        beforeState: null,
        afterState: null,
        metadata: { event: 'account.create.attempt' },
      },
    });
  } catch (_) {}

  return next();
}

// Middleware: enforce auto create policy
async function enforceAutoCreatePolicy(req, res, next) {
  const platform = (req.body?.platform || '').toLowerCase();
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent');

  if (isNonRobloxDisabledForAuto() && platform !== 'roblox') {
    return blockNonRoblox(res, platform || 'unknown', 'auto', req.user?.id, ip, userAgent);
  }

  if (!isPlatformEnabled(platform)) {
    return blockNonRoblox(res, platform || 'unknown', 'auto', req.user?.id, ip, userAgent);
  }

  // Log attempt
  try {
    await ActivityLog.create({
      activityType: 'ACCOUNT_AUTO_CREATE',
      status: 'PENDING',
      userId: req.user?.id,
      targetEntity: {
        entityType: 'Account',
        entityName: `${platform || 'unknown'}:auto`,
        platform: platform || 'unknown',
      },
      requestContext: {
        ipAddress: ip,
        userAgent,
        endpoint: '/api/accounts/auto-create',
        method: 'POST',
        timestamp: new Date(),
      },
      details: {
        beforeState: null,
        afterState: null,
        metadata: { event: 'account.create.attempt' },
      },
    });
  } catch (_) {}

  return next();
}

module.exports = {
  enforceManualCreatePolicy,
  enforceAutoCreatePolicy,
  getEnabledPlatforms,
};