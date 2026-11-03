const test = require('node:test');
const assert = require('node:assert/strict');
const cronAuth = require('../middleware/cronAuth');

function runMiddleware(authorization) {
  let statusCode = 200;
  let body;
  let nextCalled = false;
  const req = { get: (name) => (name.toLowerCase() === 'authorization' ? authorization : undefined) };
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; },
  };
  cronAuth(req, res, () => { nextCalled = true; });
  return { statusCode, body, nextCalled };
}

test('scheduled reminder authentication accepts only the configured bearer secret', () => {
  const previousSecret = process.env.REMINDER_CRON_SECRET;
  try {
    process.env.REMINDER_CRON_SECRET = 'test-secret-123456789';
    assert.deepEqual(runMiddleware('Bearer test-secret-123456789'), {
      statusCode: 200,
      body: undefined,
      nextCalled: true,
    });
    assert.equal(runMiddleware(undefined).statusCode, 401);
    assert.equal(runMiddleware('Bearer wrong-secret').statusCode, 401);

    delete process.env.REMINDER_CRON_SECRET;
    assert.equal(runMiddleware('Bearer test-secret-123456789').statusCode, 503);
  } finally {
    if (previousSecret === undefined) delete process.env.REMINDER_CRON_SECRET;
    else process.env.REMINDER_CRON_SECRET = previousSecret;
  }
});
