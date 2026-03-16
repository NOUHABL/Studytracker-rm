const rateLimit = require('express-rate-limit');

/** Applied globally – 200 requests per minute per IP */
const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

/** Tighter limit for activity endpoint (extension pings every 30 s) */
const activityRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Activity rate limit exceeded.' },
});

module.exports = { globalRateLimit, activityRateLimit };
