const nodemailer = require('nodemailer');

const host = (process.env.SMTP_HOST || '').trim();
const user = (process.env.SMTP_USER || '').trim();
const pass = process.env.SMTP_PASS || '';
const sender = (process.env.SMTP_FROM || '').trim();
const port = Number(process.env.SMTP_PORT || 587);
const secureSetting = (process.env.SMTP_SECURE || '').trim().toLowerCase();
const secure = secureSetting ? ['1', 'true', 'yes'].includes(secureSetting) : port === 465;
const hasPartialAuth = Boolean(user) !== Boolean(pass);
const configError = hasPartialAuth
  ? 'SMTP_USER and SMTP_PASS must either both be set or both be empty.'
  : (!host && (user || pass) ? 'SMTP_HOST is required when SMTP credentials are set.'
    : (host && (!Number.isInteger(port) || port < 1 || port > 65535) ? 'SMTP_PORT must be an integer from 1 to 65535.'
      : (host && secureSetting && !['1', 'true', 'yes', '0', 'false', 'no'].includes(secureSetting)
        ? 'SMTP_SECURE must be true or false.'
        : (host && !user && !sender ? 'SMTP_FROM is required when SMTP authentication is not used.' : ''))));
let transporter = null;
let previewWarningShown = false;

if (host && !configError) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass ? { auth: { user, pass } } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  transporter.verify((error) => {
    if (error) console.warn('SMTP verification failed:', error.message);
    else console.log('SMTP transport verified and ready.');
  });
} else if (configError) {
  console.error(configError);
} else {
  console.warn('SMTP is not configured; reminder emails will be previewed, not sent.');
}

function getMailStatus() {
  if (configError) return { configured: false, reason: 'invalid_smtp_configuration' };
  return { configured: Boolean(transporter), reason: transporter ? null : 'smtp_not_configured' };
}

async function sendMail({ to, subject, html, text }) {
  if (configError) throw new Error(configError);
  if (!transporter) {
    if (!previewWarningShown) {
      console.warn('Email preview only; set SMTP_HOST to enable delivery.');
      previewWarningShown = true;
    }
    console.log(`[MAIL PREVIEW] Subject: ${subject}`);
    return { delivered: false, preview: true };
  }

  const from = sender || user;
  const info = await transporter.sendMail({ from, to, subject, html, text });
  return { delivered: true, messageId: info.messageId };
}

module.exports = { getMailStatus, sendMail };
