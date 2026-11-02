const test = require('node:test');
const assert = require('node:assert/strict');

process.env.EMAIL_PROVIDER = 'resend';
process.env.RESEND_API_KEY = 'test_api_key';
process.env.EMAIL_FROM = 'WarrantyVault <warranty@example.test>';

const { getMailStatus, sendMail } = require('../utils/mailer');

test('Resend provider sends email over HTTPS and returns the delivery id', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'email-test-id' }),
    };
  };

  const result = await sendMail({
    to: 'admin@example.test',
    subject: 'Test',
    html: '<p>Hello</p>',
    text: 'Hello',
  });

  assert.deepEqual(result, { delivered: true, messageId: 'email-test-id' });
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer test_api_key');
  assert.deepEqual(JSON.parse(request.options.body), {
    from: 'WarrantyVault <warranty@example.test>',
    to: ['admin@example.test'],
    subject: 'Test',
    html: '<p>Hello</p>',
    text: 'Hello',
  });
  assert.deepEqual(getMailStatus(), { configured: true, provider: 'resend', reason: null });
});

test('Resend API errors are surfaced without treating email as delivered', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => ({
    ok: false,
    status: 403,
    json: async () => ({ message: 'Sender domain is not verified' }),
  });

  await assert.rejects(
    sendMail({ to: 'admin@example.test', subject: 'Test', html: '<p>Hi</p>', text: 'Hi' }),
    /Sender domain is not verified/
  );
});
