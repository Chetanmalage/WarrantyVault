const test = require('node:test');
const assert = require('node:assert/strict');
const { runReminders } = require('../jobs/runReminders');

const env = {
  REMINDER_API_URL: 'https://warranty.example/api/internal/reminders',
  REMINDER_CRON_SECRET: 'test-cron-secret',
};

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test('cron client calls the protected endpoint and logs only delivery counts', async () => {
  let request;
  const logs = [];
  const result = await runReminders({
    env,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response({
        usersChecked: 4,
        emailsSent: 2,
        emailsPreviewed: 0,
        productsNotified: 3,
        skipped: 2,
        failed: 0,
        emailConfigured: true,
      });
    },
    logger: { log: (...values) => logs.push(values) },
  });

  assert.equal(request.url, env.REMINDER_API_URL);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, `Bearer ${env.REMINDER_CRON_SECRET}`);
  assert.equal(request.options.signal instanceof AbortSignal, true);
  assert.equal(result.emailsSent, 2);
  assert.equal(logs.length, 1);
  assert.equal(JSON.stringify(logs).includes(env.REMINDER_CRON_SECRET), false);
});

test('cron client rejects missing credentials, HTTP errors, and blocked delivery results', async () => {
  await assert.rejects(runReminders({ env: {} }), /REMINDER_API_URL and REMINDER_CRON_SECRET/);

  await assert.rejects(
    runReminders({ env, fetchImpl: async () => response({ message: 'Unauthorized' }, 401), logger: { log() {} } }),
    /HTTP 401/
  );

  await assert.rejects(
    runReminders({
      env,
      fetchImpl: async () => response({ emailConfigured: true, blockedReason: 'resend_test_sender', failed: 0 }),
      logger: { log() {} },
    }),
    /delivery blocked/
  );

  await assert.rejects(
    runReminders({
      env,
      fetchImpl: async () => response({ emailConfigured: true, failed: 1 }),
      logger: { log() {} },
    }),
    /delivery blocked/
  );
});
