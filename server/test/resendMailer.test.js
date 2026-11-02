const test = require('node:test');
const assert = require('node:assert/strict');

process.env.EMAIL_PROVIDER = 'resend';
process.env.RESEND_API_KEY = 'test_resend_api_key';
process.env.SENDGRID_API_KEY = 'test_sendgrid_api_key';
process.env.EMAIL_FROM = 'WarrantyVault <warranty@example.test>';

const { getMailStatus, sendMail } = require('../utils/mailer');

const message = {
  to: 'admin@example.test',
  subject: 'Test',
  html: '<p>Hello</p>',
  text: 'Hello',
};

function jsonResponse({ ok, status, body }) {
  return { ok, status, json: async () => body };
}

test('Resend provider sends email over HTTPS and returns the delivery id', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return jsonResponse({ ok: true, status: 200, body: { id: 'email-test-id' } });
  };

  const result = await sendMail(message);

  assert.deepEqual(result, { delivered: true, messageId: 'email-test-id', provider: 'resend' });
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer test_resend_api_key');
  assert.deepEqual(JSON.parse(request.options.body), {
    from: 'WarrantyVault <warranty@example.test>',
    to: ['admin@example.test'],
    subject: 'Test',
    html: '<p>Hello</p>',
    text: 'Hello',
  });
  assert.deepEqual(getMailStatus(), {
    configured: true,
    provider: 'resend',
    fallbackProvider: 'sendgrid',
    fallbackConfigured: true,
    reason: null,
  });
});

test('a rejected Resend request falls back to SendGrid over HTTPS', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url === 'https://api.resend.com/emails') {
      return jsonResponse({ ok: false, status: 403, body: { message: 'Sender domain is not verified' } });
    }
    return {
      status: 202,
      headers: { get: (name) => name.toLowerCase() === 'x-message-id' ? 'sendgrid-message-id' : null },
    };
  };

  const result = await sendMail(message);

  assert.deepEqual(result, {
    delivered: true,
    messageId: 'sendgrid-message-id',
    provider: 'sendgrid',
    fallbackUsed: true,
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, 'https://api.sendgrid.com/v3/mail/send');
  assert.equal(requests[1].options.headers.Authorization, 'Bearer test_sendgrid_api_key');
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    personalizations: [{ to: [{ email: 'admin@example.test' }] }],
    from: { email: 'warranty@example.test', name: 'WarrantyVault' },
    subject: 'Test',
    content: [
      { type: 'text/plain', value: 'Hello' },
      { type: 'text/html', value: '<p>Hello</p>' },
    ],
  });
});

test('a Resend network failure also attempts the configured SendGrid fallback', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  const requests = [];
  global.fetch = async (url) => {
    requests.push(url);
    if (url === 'https://api.resend.com/emails') throw new Error('simulated connection failure');
    return { status: 202, headers: { get: () => null } };
  };

  const result = await sendMail(message);
  assert.equal(result.delivered, true);
  assert.equal(result.provider, 'sendgrid');
  assert.equal(result.fallbackUsed, true);
  assert.deepEqual(requests, [
    'https://api.resend.com/emails',
    'https://api.sendgrid.com/v3/mail/send',
  ]);
});

test('a failed fallback is not reported as delivered', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async (url) => url === 'https://api.resend.com/emails'
    ? jsonResponse({ ok: false, status: 503, body: { message: 'temporarily unavailable' } })
    : { status: 401, headers: { get: () => null } };

  await assert.rejects(
    sendMail(message),
    /Email delivery failed with Resend and SendGrid \(SendGrid status 401\)/
  );
});
