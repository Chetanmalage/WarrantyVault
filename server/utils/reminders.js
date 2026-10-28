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
  const rows = items.map((product) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee">
        <strong>${escapeHtml(product.name)}</strong><br>
        <small style="color:#64748b">${escapeHtml(product.brand || '—')} · ${escapeHtml(product.category || 'Other')}</small>
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee">
        ${escapeHtml(formatWarrantyDate(product.warrantyEnd))}
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;color:${product.daysRemaining <= 7 ? '#dc2626' : '#b45309'}">
        ${product.daysRemaining === 0 ? 'Expires today' : `${product.daysRemaining} day${product.daysRemaining === 1 ? '' : 's'} left`}
      </td>
    </tr>`).join('');
  const appUrl = (process.env.APP_URL || '').trim();
  const appLink = /^https?:\/\//i.test(appUrl)
    ? `<p style="margin:20px 0"><a href="${escapeHtml(appUrl)}" style="background:#2563eb;color:#fff;text-decoration:none;padding:11px 16px;border-radius:8px">Open WarrantyVault</a></p>`
    : '';

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:auto;padding:24px;background:#f8fafc;border-radius:14px;color:#0f172a">
      <h2 style="margin:0 0 8px">Hi ${escapeHtml(String(user.name || 'there').trim().split(/\s+/)[0])}, warranty reminder</h2>
      <p style="color:#475569;margin:0 0 18px">${items.length} product warranty${items.length === 1 ? ' is' : 'ies are'} within your reminder window.</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;font-size:14px">
        <thead><tr style="background:#f1f5f9;text-align:left"><th style="padding:10px">Product</th><th style="padding:10px">Expires</th><th style="padding:10px">Remaining</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${appLink}
      <p style="color:#64748b;font-size:12px;margin-top:18px">This is a one-time reminder for each product and expiry date. You can change your email reminder settings in WarrantyVault.</p>
    </div>`;
}

function buildReminderText(user, items) {
  const lines = items.map((product) => {
    const expiry = formatWarrantyDate(product.warrantyEnd);
    const remaining = product.daysRemaining === 0 ? 'expires today' : `${product.daysRemaining} day(s) left`;
    return `- ${product.name} (${product.brand || '—'}): ${expiry}, ${remaining}`;
  });
  const appUrl = (process.env.APP_URL || '').trim();
  return [`Hi ${String(user.name || 'there').trim().split(/\s+/)[0]},`, '', 'Warranty reminder:', ...lines, '', /^https?:\/\//i.test(appUrl) ? `Open WarrantyVault: ${appUrl}` : '', 'This is a one-time reminder for each product and expiry date.'].filter(Boolean).join('\n');
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

      const subject = `Warranty reminder: ${items.length} product${items.length === 1 ? '' : 's'} expiring soon`;
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
