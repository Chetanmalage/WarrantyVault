const User = require('../models/User');
const Product = require('../models/Product');
const ReminderDelivery = require('../models/ReminderDelivery');
const ReminderRun = require('../models/ReminderRun');
const { getMailStatus, sendMail } = require('./mailer');

const PENDING_STALE_MS = 30 * 60 * 1000;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function formatWarrantyDate(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(value));
}

function buildReminderHtml(user, items) {
  const rows = items.map((product) => {
    const urgent = product.daysRemaining <= 7;
    const remaining = product.daysRemaining === 0
      ? 'Expires today'
      : `${product.daysRemaining} day${product.daysRemaining === 1 ? '' : 's'} left`;
    return `
      <tr>
        <td style="padding:16px 14px;border-bottom:1px solid #edf0f6">
          <strong style="display:block;color:#20243a;font-size:14px">${escapeHtml(product.name)}</strong>
          <span style="display:block;margin-top:4px;color:#798196;font-size:12px">${escapeHtml(product.brand || '—')} &middot; ${escapeHtml(product.category || 'Other')}</span>
        </td>
        <td style="padding:16px 10px;border-bottom:1px solid #edf0f6;color:#4b5267;font-size:12px;white-space:nowrap">
          ${escapeHtml(formatWarrantyDate(product.warrantyEnd))}
        </td>
        <td style="padding:16px 10px;border-bottom:1px solid #edf0f6;text-align:right">
          <span style="display:inline-block;padding:6px 9px;border-radius:20px;background:${urgent ? '#fff0ed' : '#fff6e5'};color:${urgent ? '#c65343' : '#a66a0a'};font-size:11px;font-weight:700;white-space:nowrap">${escapeHtml(remaining)}</span>
        </td>
      </tr>`;
  }).join('');
  const appUrl = (process.env.APP_URL || '').trim();
  const appLink = /^https?:\/\//i.test(appUrl)
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0"><tr><td bgcolor="#6d5efc" style="border-radius:8px"><a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:12px 18px;color:#fff;text-decoration:none;font-size:13px;font-weight:700">Open your warranty vault&nbsp; &rarr;</a></td></tr></table>`
    : '';
  const reminderDays = Math.max(1, Math.min(90, Number(user.reminderDays) || 30));

  return `
    <div style="margin:0;padding:32px 12px;background:#f4f5fa;font-family:Arial,Helvetica,sans-serif;color:#20243a">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e8eaf1;border-radius:14px;overflow:hidden">
        <tr><td style="padding:24px 28px;background:#211d49;border-bottom:4px solid #6d5efc">
          <span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-.3px">Warranty<span style="color:#bdb5ff">Vault</span></span>
          <span style="float:right;padding:6px 9px;border:1px solid #514a7b;border-radius:20px;color:#d9d5fa;font-size:10px;font-weight:700;letter-spacing:.5px">WARRANTY UPDATE</span>
        </td></tr>
        <tr><td style="padding:28px 28px 12px">
          <p style="margin:0 0 8px;color:#7770cb;font-size:11px;font-weight:700;letter-spacing:1px">A LITTLE HEADS-UP</p>
          <h1 style="margin:0;color:#20243a;font-size:23px;line-height:1.3;letter-spacing:-.5px">Hi ${escapeHtml(String(user.name || 'there').trim().split(/\s+/)[0])}, your coverage deserves a check-in.</h1>
          <p style="margin:10px 0 0;color:#697187;font-size:14px;line-height:1.65">${items.length} ${items.length === 1 ? 'warranty is' : 'warranties are'} coming up within your ${reminderDays}-day reminder window.</p>
        </td></tr>
        <tr><td style="padding:12px 28px 0">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #edf0f6;border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden">
            <thead><tr style="background:#f8f8fc;text-align:left">
              <th style="padding:11px 14px;color:#747b91;font-size:10px;letter-spacing:.6px">PRODUCT</th>
              <th style="padding:11px 10px;color:#747b91;font-size:10px;letter-spacing:.6px">EXPIRES</th>
              <th style="padding:11px 10px;color:#747b91;font-size:10px;letter-spacing:.6px;text-align:right">STATUS</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          ${appLink}
        </td></tr>
        <tr><td style="padding:24px 28px 22px">
          <p style="margin:0;padding-top:17px;border-top:1px solid #edf0f6;color:#7b8294;font-size:11px;line-height:1.65">You’re receiving this one-time heads-up for products entering your reminder window. Adjust your email reminders any time in WarrantyVault settings.</p>
          <p style="margin:12px 0 0;color:#9a9eab;font-size:10px">A little more peace of mind, one warranty at a time.</p>
        </td></tr>
      </table>
    </div>`;
}

function buildReminderText(user, items) {
  const lines = items.map((product) => {
    const expiry = formatWarrantyDate(product.warrantyEnd);
    const remaining = product.daysRemaining === 0 ? 'expires today' : `${product.daysRemaining} day(s) left`;
    return `- ${product.name} (${product.brand || '—'}): ${expiry}, ${remaining}`;
  });
  const appUrl = (process.env.APP_URL || '').trim();
  const reminderDays = Math.max(1, Math.min(90, Number(user.reminderDays) || 30));
  return [
    `Hi ${String(user.name || 'there').trim().split(/\s+/)[0]},`,
    '',
    `${items.length} ${items.length === 1 ? 'warranty is' : 'warranties are'} coming up within your ${reminderDays}-day reminder window.`,
    '',
    ...lines,
    '',
    /^https?:\/\//i.test(appUrl) ? `Open your warranty vault: ${appUrl}` : '',
    'This is a one-time heads-up for products entering your reminder window.',
  ].filter(Boolean).join('\n');
}

function startOfToday(now = new Date(), timeZone = process.env.REMINDER_TIMEZONE || 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (type) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

async function removePendingClaims(runId, deliveryIds) {
  const tasks = [];
  if (deliveryIds.length) tasks.push(ReminderDelivery.deleteMany({ _id: { $in: deliveryIds }, status: 'pending' }));
  if (runId) tasks.push(ReminderRun.deleteOne({ _id: runId, status: 'pending' }));
  await Promise.allSettled(tasks);
}

async function sendDueReminders() {
  const staleBefore = new Date(Date.now() - PENDING_STALE_MS);
  await Promise.all([
    ReminderDelivery.deleteMany({ status: 'pending', createdAt: { $lt: staleBefore } }),
    ReminderRun.deleteMany({ status: 'pending', createdAt: { $lt: staleBefore } }),
  ]);

  const users = await User.find({ emailReminders: true });
  const result = {
    usersChecked: users.length,
    emailsSent: 0,
    emailsPreviewed: 0,
    productsNotified: 0,
    skipped: 0,
    failed: 0,
    emailConfigured: getMailStatus().configured,
  };

  for (const user of users) {
    const thresholdDays = Math.max(1, Math.min(90, Number(user.reminderDays) || 30));
    const today = startOfToday();
    const horizon = new Date(today);
    horizon.setUTCDate(horizon.getUTCDate() + thresholdDays);
    horizon.setUTCHours(23, 59, 59, 999);

    const products = await Product.find({
      user: user._id,
      warrantyEnd: { $gte: today, $lte: horizon },
    });
    const dueProducts = products
      .map((product) => {
        const expiry = new Date(product.warrantyEnd);
        const expiryDay = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
        const daysRemaining = Math.round((expiryDay - today.getTime()) / 86400000);
        return { document: product, daysRemaining };
      })
      .filter(({ daysRemaining }) => daysRemaining >= 0 && daysRemaining <= thresholdDays)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
    if (!dueProducts.length) {
      result.skipped++;
      continue;
    }

    const runDate = new Date(today);
    let run;
    try {
      run = await ReminderRun.create({ user: user._id, runDate, status: 'pending' });
    } catch (error) {
      if (error.code === 11000) {
        result.skipped++;
        continue;
      }
      throw error;
    }

    const deliveryIds = [];
    const items = [];
    try {
      for (const { document, daysRemaining } of dueProducts) {
        try {
          const delivery = await ReminderDelivery.create({
            user: user._id,
            product: document._id,
            thresholdDays,
            warrantyEnd: document.warrantyEnd,
            status: 'pending',
          });
          deliveryIds.push(delivery._id);
          items.push({ ...document.toObject(), daysRemaining });
        } catch (error) {
          if (error.code !== 11000) throw error;
        }
      }

      if (!items.length) {
        await run.deleteOne();
        result.skipped++;
        continue;
      }

      const subject = `Warranty heads-up: ${items.length} product${items.length === 1 ? '' : 's'} coming up`;
      const mail = await sendMail({
        to: user.email,
        subject,
        html: buildReminderHtml(user, items),
        text: buildReminderText(user, items),
      });

      if (mail.preview) {
        await removePendingClaims(run._id, deliveryIds);
        result.emailsPreviewed++;
        continue;
      }

      const sentAt = new Date();
      await ReminderDelivery.updateMany({ _id: { $in: deliveryIds } }, { $set: { status: 'sent', sentAt } });
      run.status = 'sent';
      run.sentAt = sentAt;
      await run.save();
      result.emailsSent++;
      result.productsNotified += items.length;
    } catch (error) {
      await removePendingClaims(run._id, deliveryIds);
      result.failed++;
      console.error(`Warranty reminder failed for one account: ${error.message}`);
    }
  }

  return result;
}

module.exports = { buildReminderHtml, buildReminderText, formatWarrantyDate, sendDueReminders, startOfToday };
