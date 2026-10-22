const User = require('../models/User');
const Product = require('../models/Product');
const { sendMail } = require('./mailer');

function buildHtml(user, items) {
  const rows = items
    .map(
      (p) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee">
          <strong>${p.name}</strong><br>
          <small style="color:#64748b">${p.brand || '—'} · ${p.category}</small>
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee">
          ${new Date(p.warrantyEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;color:${p.daysRemaining <= 7 ? '#dc2626' : '#b45309'}">
          ${p.daysRemaining} day${p.daysRemaining === 1 ? '' : 's'} left
        </td>
      </tr>`
    )
    .join('');

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:14px">
      <h2 style="color:#0f172a;margin:0 0 8px">Hi ${user.name.split(' ')[0]} 👋</h2>
      <p style="color:#475569;margin:0 0 18px">Some of your product warranties are expiring soon. Here's the list:</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;font-size:14px">
        <thead>
          <tr style="background:#f1f5f9;text-align:left">
            <th style="padding:10px">Product</th>
            <th style="padding:10px">Expires</th>
            <th style="padding:10px">Remaining</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#64748b;font-size:12px;margin-top:18px">
        You can turn reminders off or change the reminder window from the Settings page in WarrantyVault.
      </p>
    </div>`;
}

async function sendDueReminders() {
  const users = await User.find({ emailReminders: true });
  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const days = user.reminderDays || 30;
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + days);

    const products = await Product.find({
      user: user._id,
      warrantyEnd: { $gte: new Date(), $lte: horizon },
    });

    if (!products.length) { skipped++; continue; }

    const items = products
      .map((p) => ({ ...p.toObject(), daysRemaining: p.daysRemaining }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    await sendMail({
      to: user.email,
      subject: `⏰ ${items.length} warranty reminder${items.length === 1 ? '' : 's'}: expiring soon`,
      html: buildHtml(user, items),
    });

    sent++;
  }

  return { usersChecked: users.length, emailsSent: sent, skipped };
}

module.exports = { sendDueReminders };