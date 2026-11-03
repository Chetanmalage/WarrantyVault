const { timingSafeEqual } = require('node:crypto');

function cronAuth(req, res, next) {
  const expected = process.env.REMINDER_CRON_SECRET || '';
  if (!expected) {
    return res.status(503).json({ message: 'Scheduled reminder authentication is not configured.' });
  }

  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ message: 'Unauthorized.' });

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(match[1]);
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  return next();
}

module.exports = cronAuth;
