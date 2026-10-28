const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Product = require('../models/Product');
const ReminderDelivery = require('../models/ReminderDelivery');
const ReminderRun = require('../models/ReminderRun');
const { buildReminderHtml, buildReminderText, formatWarrantyDate, startOfToday } = require('../utils/reminders');
const { getMailStatus, sendMail } = require('../utils/mailer');
const { startReminderScheduler } = require('../utils/reminderScheduler');
const { updatePreferences } = require('../controllers/authController');

test('reminder HTML escapes account and product values', () => {
  const html = buildReminderHtml(
    { name: '<img>' },
    [{
      name: 'TV <script>alert(1)</script>',
      brand: 'Brand & Co',
      category: 'TV',
      warrantyEnd: '2026-11-01T00:00:00.000Z',
      daysRemaining: 1,
    }]
  );
  assert.ok(html.includes('&lt;img&gt;'));
  assert.ok(html.includes('TV &lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('Brand &amp; Co'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
});

test('expiry-day reminders use clear zero-day wording in HTML and text', () => {
  const product = {
    name: 'Camera',
    brand: 'Example',
    category: 'Camera',
    warrantyEnd: '2026-10-28T00:00:00.000Z',
    daysRemaining: 0,
  };
  assert.ok(buildReminderHtml({ name: 'User' }, [product]).includes('Expires today'));
  assert.ok(buildReminderText({ name: 'User' }, [product]).includes('expires today'));
});

test('reminder link only accepts HTTP(S) application URLs', () => {
  const original = process.env.APP_URL;
  try {
    process.env.APP_URL = 'javascript:alert(1)';
    assert.ok(!buildReminderHtml({ name: 'User' }, []).includes('href="javascript:'));
    process.env.APP_URL = 'https://warranty.example';
    assert.ok(buildReminderHtml({ name: 'User' }, []).includes('href="https://warranty.example"'));
  } finally {
    if (original === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = original;
  }
});

test('run dates use the configured reminder timezone calendar day', () => {
  const date = startOfToday(new Date('2026-10-28T17:42:13.000Z'), 'UTC');
  assert.equal(date.toISOString(), '2026-10-28T00:00:00.000Z');
  const losAngelesDay = startOfToday(new Date('2026-10-28T03:00:00.000Z'), 'America/Los_Angeles');
  assert.equal(losAngelesDay.toISOString(), '2026-10-27T00:00:00.000Z');
});

test('date-only warranty expiry displays the stored calendar date in every host timezone', () => {
  assert.equal(formatWarrantyDate('2026-11-01T00:00:00.000Z'), '01 Nov 2026');
});

test('Mongo schemas enforce one delivery per product window and one daily digest per user', () => {
  const deliveryIndex = ReminderDelivery.schema.indexes().find(([keys]) => keys.product === 1);
  const runIndex = ReminderRun.schema.indexes().find(([keys]) => keys.runDate === 1);
  assert.equal(deliveryIndex?.[1]?.unique, true);
  assert.equal(runIndex?.[1]?.unique, true);
});

test('missing SMTP configuration previews instead of reporting a sent email', async (t) => {
  if (process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_PASS) {
    t.skip('SMTP settings are supplied by the test environment');
    return;
  }
  assert.equal(getMailStatus().configured, false);
  const result = await sendMail({ to: 'test@example.com', subject: 'preview test', html: '<p>preview</p>' });
  assert.equal(result.delivered, false);
  assert.equal(result.preview, true);
});

test('scheduler validates cron and timezone and can be stopped cleanly', () => {
  const previousCron = process.env.REMINDER_CRON;
  const previousTimezone = process.env.REMINDER_TIMEZONE;
  try {
    process.env.REMINDER_CRON = 'not a cron';
    process.env.REMINDER_TIMEZONE = 'UTC';
    assert.throws(() => startReminderScheduler(), /Invalid REMINDER_CRON/);
    process.env.REMINDER_CRON = '* * * * *';
    process.env.REMINDER_TIMEZONE = 'Not/A_Real_Zone';
    assert.throws(() => startReminderScheduler(), /Invalid REMINDER_TIMEZONE/);
    process.env.REMINDER_TIMEZONE = 'UTC';
    const task = startReminderScheduler();
    assert.equal(typeof task.stop, 'function');
    task.stop();
  } finally {
    if (previousCron === undefined) delete process.env.REMINDER_CRON;
    else process.env.REMINDER_CRON = previousCron;
    if (previousTimezone === undefined) delete process.env.REMINDER_TIMEZONE;
    else process.env.REMINDER_TIMEZONE = previousTimezone;
  }
});

test('reminder preference API rejects string booleans', async () => {
  let statusCode;
  const req = { body: { emailReminders: 'false' }, user: { save: async () => {} } };
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await updatePreferences(req, res, (error) => { throw error; });
  assert.equal(statusCode, 400);
  assert.match(res.body.message, /true or false/);
});

test('due reminder preview releases claims so a later SMTP-enabled run can deliver', async (t) => {
  if (process.env.SMTP_HOST || process.env.SMTP_USER || process.env.SMTP_PASS) {
    t.skip('SMTP settings are supplied by the test environment');
    return;
  }
  const original = {
    userFind: User.find,
    productFind: Product.find,
    deliveryCreate: ReminderDelivery.create,
    deliveryDeleteMany: ReminderDelivery.deleteMany,
    deliveryUpdateMany: ReminderDelivery.updateMany,
    runCreate: ReminderRun.create,
    runDeleteMany: ReminderRun.deleteMany,
    runDeleteOne: ReminderRun.deleteOne,
  };
  t.after(() => {
    User.find = original.userFind;
    Product.find = original.productFind;
    ReminderDelivery.create = original.deliveryCreate;
    ReminderDelivery.deleteMany = original.deliveryDeleteMany;
    ReminderDelivery.updateMany = original.deliveryUpdateMany;
    ReminderRun.create = original.runCreate;
    ReminderRun.deleteMany = original.runDeleteMany;
    ReminderRun.deleteOne = original.runDeleteOne;
  });

  let claimedDeliveries = 0;
  let releasedDeliveries = 0;
  let releasedRuns = 0;
  User.find = async () => [{ _id: 'user-1', name: 'Example', email: 'example@test.invalid', emailReminders: true, reminderDays: 30 }];
  Product.find = async () => [{
    _id: 'product-1',
    name: 'Camera',
    brand: 'Example',
    category: 'Camera',
    warrantyEnd: new Date(Date.now() + 3 * 86400000),
    daysRemaining: 3,
    toObject() { return { name: this.name, brand: this.brand, category: this.category, warrantyEnd: this.warrantyEnd }; },
  }];
  ReminderDelivery.deleteMany = async (filter) => {
    if (filter._id) releasedDeliveries += filter._id.$in.length;
    return { deletedCount: 0 };
  };
  ReminderDelivery.create = async () => ({ _id: `delivery-${++claimedDeliveries}` });
  ReminderDelivery.updateMany = async () => { throw new Error('Preview must not mark a delivery as sent'); };
  ReminderRun.deleteMany = async () => ({ deletedCount: 0 });
  ReminderRun.create = async () => ({ _id: 'run-1' });
  ReminderRun.deleteOne = async () => { releasedRuns++; return { deletedCount: 1 }; };

  const result = await require('../utils/reminders').sendDueReminders();
  assert.equal(result.emailsSent, 0);
  assert.equal(result.emailsPreviewed, 1);
  assert.equal(result.productsNotified, 0);
  assert.equal(result.failed, 0);
  assert.equal(claimedDeliveries, 1);
  assert.equal(releasedDeliveries, 1);
  assert.equal(releasedRuns, 1);
});
