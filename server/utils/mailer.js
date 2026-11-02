const nodemailer = require('nodemailer');

const provider = (process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();
const host = (process.env.SMTP_HOST || '').trim();
const user = (process.env.SMTP_USER || '').trim();
const pass = process.env.SMTP_PASS || '';
const sender = (process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim();
const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const port = Number(process.env.SMTP_PORT || 587);
const secureSetting = (process.env.SMTP_SECURE || '').trim().toLowerCase();
const secure = secureSetting ? ['1', 'true', 'yes'].includes(secureSetting) : port === 465;
const hasPartialAuth = Boolean(user) !== Boolean(pass);
const smtpConfigError = hasPartialAuth
  ? 'SMTP_USER and SMTP_PASS must either both be set or both be empty.'
  : (!host && (user || pass) ? 'SMTP_HOST is required when SMTP credentials are set.'
    : (host && (!Number.isInteger(port) || port < 1 || port > 65535) ? 'SMTP_PORT must be an integer from 1 to 65535.'
      : (host && secureSetting && !['1', 'true', 'yes', '0', 'false', 'no'].includes(secureSetting)
        ? 'SMTP_SECURE must be true or false.'
        : (host && !user && !sender ? 'EMAIL_FROM or SMTP_FROM is required when SMTP authentication is not used.' : ''))));
const configError = provider === 'resend'
  ? (!resendApiKey ? 'RESEND_API_KEY is required when EMAIL_PROVIDER=resend.'
    : (!sender ? 'EMAIL_FROM is required when EMAIL_PROVIDER=resend.' : ''))
  : (provider === 'smtp' ? smtpConfigError : 'EMAIL_PROVIDER must be either "smtp" or "resend".');
let transporter = null;
let previewWarningShown = false;

if (provider === 'smtp' && host && !configError) {
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
} else if (provider === 'smtp') {
  console.warn('SMTP is not configured; reminder emails will be previewed, not sent.');
}

function getMailStatus() {
  const providerName = provider === 'resend' ? 'resend' : provider === 'smtp' ? 'smtp' : provider;
  if (configError) {
    return {
      configured: false,
      provider: providerName,
      reason: provider === 'resend' ? 'invalid_resend_configuration'
        : provider === 'smtp' ? 'invalid_smtp_configuration' : 'unsupported_email_provider',
    };
  }
  const configured = provider === 'resend' ? true : Boolean(transporter);
  return {
    configured,
    provider: providerName,
    reason: configured ? null : 'smtp_not_configured',
  };
}

async function sendMail({ to, subject, html, text }) {
  if (configError) throw new Error(configError);
  if (provider === 'resend') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: sender, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(15_000),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Resend API request failed (${response.status})`);
    }
    return { delivered: true, messageId: result.id };
  }

  if (!transporter) {
    if (!previewWarningShown) {
      console.warn('Email preview only; configure SMTP or Resend to enable delivery.');
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
