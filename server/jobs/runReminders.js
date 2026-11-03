require('dotenv').config();

async function runReminders({ env = process.env, fetchImpl = fetch, logger = console } = {}) {
  const apiUrl = env.REMINDER_API_URL;
  const secret = env.REMINDER_CRON_SECRET;
  if (!apiUrl || !secret) {
    throw new Error('REMINDER_API_URL and REMINDER_CRON_SECRET must be configured.');
  }

  const response = await fetchImpl(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(180_000),
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    throw new Error(`Reminder API returned invalid JSON (HTTP ${response.status}).`);
  }

  if (!response.ok) throw new Error(`Reminder API returned HTTP ${response.status}.`);

  const summary = {
    usersChecked: result.usersChecked ?? 0,
    emailsSent: result.emailsSent ?? 0,
    emailsPreviewed: result.emailsPreviewed ?? 0,
    productsNotified: result.productsNotified ?? 0,
    skipped: result.skipped ?? 0,
    failed: result.failed ?? 0,
    blockedReason: result.blockedReason,
  };
  logger.log('Warranty reminder job finished:', JSON.stringify(summary));

  if (!result.emailConfigured || result.blockedReason || result.failed > 0) {
    throw new Error('Reminder job completed with email delivery blocked, unconfigured, or failed.');
  }

  return result;
}

if (require.main === module) {
  runReminders().catch((error) => {
    console.error('Warranty reminder job failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { runReminders };
