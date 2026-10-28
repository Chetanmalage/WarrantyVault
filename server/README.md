# WarrantyVault server notifications

## Automated warranty email notifications

The server runs a daily warranty reminder job. It checks accounts with email reminders enabled, selects products expiring within each account's chosen 1–90 day window, and sends one digest email per account. A product is included only once for that selected window and expiry date, preventing daily repeat emails. Changing the reminder window or extending a product's warranty can create a new eligible reminder.

Configure SMTP in the server's environment (not in source control). Copy `.env.example` to `.env` for local development, then set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and a verified `SMTP_FROM` address from your mail provider. A provider that does not require authentication may omit `SMTP_USER` and `SMTP_PASS`. The Admin panel shows whether SMTP settings are present. If SMTP is not configured, the app reports a preview instead of claiming an email was sent; no reminder delivery is recorded, so it can be sent after SMTP is configured.

`REMINDER_CRON` controls the daily schedule and defaults to `0 9 * * *`. `REMINDER_TIMEZONE` controls the schedule timezone and defaults to `UTC` (for example, use `Asia/Kolkata` for India Standard Time). Set `APP_URL` to the public WarrantyVault URL to include an app link in reminder emails.

The scheduler runs inside the Node server process, so keep at least one backend instance running. If the hosting platform sleeps the server or runs it only as serverless functions, use an always-on worker or that platform's scheduled-job service to invoke the reminder job instead.

Users can turn reminders on or off and select their reminder window in **Settings → Email reminders**. An administrator can manually run the same due-reminder job from the Admin panel. The manual run respects user preferences and duplicate protection.

## Environment variable inventory

The server example covers all server variables used by the code: `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `APP_URL`, optional `ADMIN_EMAIL` and `ADMIN_PASSWORD` (set both or leave both blank), `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `REMINDER_CRON`, and `REMINDER_TIMEZONE`. Keep real secrets in your deployment's secret/environment settings, not in Git. The client has a separate [`client/.env.example`](../client/.env.example) for optional `VITE_API_URL`; blank uses the built-in development and production defaults. Vite's `import.meta.env.DEV` flag is supplied by Vite and should not be set manually.
