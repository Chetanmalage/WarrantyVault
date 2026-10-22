const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  transporter.verify((err) =>
    err
      ? console.warn('❌ Mailer verify failed:', err.message)
      : console.log('📧 Mailer ready')
  );
} else {
  console.log('📧 Mailer not configured — emails will be logged to console instead of sent.');
}

async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.log(`\n[MAIL PREVIEW] To: ${to}\nSubject: ${subject}\n${html}\n`);
    return { preview: true };
  }
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'WarrantyVault <no-reply@warrantyvault.local>',
    to, subject, html,
  });
}

module.exports = { sendMail };