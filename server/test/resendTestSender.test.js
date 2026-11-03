const test = require('node:test');
const assert = require('node:assert/strict');

process.env.EMAIL_PROVIDER = 'resend';
process.env.RESEND_API_KEY = 'test_resend_api_key';
delete process.env.SENDGRID_API_KEY;
process.env.EMAIL_FROM = 'onboarding@resend.dev';

const User = require('../models/User');
const { getMailStatus } = require('../utils/mailer');
const { sendDueReminders } = require('../utils/reminders');

test('Resend shared test sender is flagged and prevents bulk reminder sends', async (t) => {
  const originalFind = User.find;
  t.after(() => { User.find = originalFind; });
  User.find = async () => [{ _id: 'owner-1', email: 'owner@example.test', emailReminders: true }];

  const status = getMailStatus();
  assert.equal(status.configured, true);
  assert.equal(status.testOnlySender, true);
  assert.equal(status.remindersReady, false);

  const result = await sendDueReminders();
  assert.equal(result.usersChecked, 1);
  assert.equal(result.emailsSent, 0);
  assert.equal(result.emailsPreviewed, 0);
  assert.equal(result.failed, 0);
  assert.equal(result.skipped, 1);
  assert.equal(result.blockedReason, 'resend_test_sender');
});
