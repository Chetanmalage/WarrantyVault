# WarrantyVault server notifications

## Automated warranty email notifications

The reminder job checks accounts with email reminders enabled, selects products expiring within each account's chosen 1–90 day window, and sends one digest per account. Delivery records prevent repeat messages for the same product, window, and expiry date. Users can manage reminders under **Settings → Email reminders**; an administrator can run a manual reminder check from the Admin page.

Configure delivery in the backend environment, never in source control. For Resend, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` using a sender on a domain verified in Resend. The shared `resend.dev` sender is test-only; WarrantyVault blocks bulk reminders while it is configured. Send a test message to the signed-in administrator after verifying your domain. Optionally set `SENDGRID_API_KEY` as a fallback and verify the same sender with SendGrid. Keep provider keys only in Render's secret settings. If delivery is unconfigured, messages are previewed and not recorded as sent.

## Free scheduled workflow

The in-process scheduler runs only while the backend process is awake. A free Render web service can sleep while idle, so that timer is not a reliable daily scheduler. This repository's [GitHub Actions workflow](../.github/workflows/warranty-reminders.yml) is the free alternative: it calls the protected backend endpoint once a day at 03:30 UTC (09:00 India time). GitHub-hosted standard runners are free for public repositories. GitHub can delay or drop scheduled runs during high load, so this is best-effort rather than an exact-time guarantee; keep an eye on the repository's Actions tab.

To configure the workflow, set a strong random `REMINDER_CRON_SECRET` on the Render backend and create a GitHub Actions repository secret with the same value. Then set `REMINDER_SCHEDULER_ENABLED=false` on the Render web service to prevent duplicate runs. The workflow is intentionally gated by the repository variable `WARRANTY_REMINDERS_ENABLED`; leave it unset or `false` until a verified sender domain is configured and the administrator test email is confirmed, then set it to `true`. The GitHub workflow receives no MongoDB, JWT, or Resend credentials; only the backend stores those secrets.

`REMINDER_CRON` and `REMINDER_TIMEZONE` control the optional in-process scheduler for an always-on deployment. They default to `0 9 * * *` and `UTC`; India users may set `REMINDER_TIMEZONE=Asia/Kolkata`. `APP_URL` is used for links in reminder emails.

## Environment variables

The server environment example covers `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `APP_URL`, optional `ADMIN_EMAIL` and `ADMIN_PASSWORD`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, optional `SENDGRID_API_KEY`, SMTP settings, `REMINDER_CRON`, `REMINDER_TIMEZONE`, `REMINDER_SCHEDULER_ENABLED`, and `REMINDER_CRON_SECRET`. The Actions secret is separate from the backend settings but must have the same token value. Keep all secrets out of Git. The client has a separate [`client/.env.example`](../client/.env.example) for optional `VITE_API_URL`.
