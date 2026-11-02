# WarrantyVault server notifications

## Automated warranty email notifications

The server runs a daily warranty reminder job. It checks accounts with email reminders enabled, selects products expiring within each account's chosen 1–90 day window, and sends one digest email per account. A product is included only once for that selected window and expiry date, preventing daily repeat emails. Changing the reminder window or extending a product's warranty can create a new eligible reminder.

Configure email delivery in the server's environment (not in source control). Set `EMAIL_PROVIDER=resend` to send through the Resend HTTPS API, then add `RESEND_API_KEY` and `EMAIL_FROM` using a sender address on a domain verified with Resend. This works on hosts that restrict outbound SMTP. Optionally set `SENDGRID_API_KEY` and verify the same sender in SendGrid; if a Resend API request fails, WarrantyVault attempts delivery through SendGrid over HTTPS. The admin test-email response identifies which provider delivered. If both providers fail, the email is reported as failed, never as sent. On Render, add these values to the backend web service's Environment settings and redeploy; never commit provider keys. Keep `APP_URL` set to the public frontend URL so emails can link back to the app.

Alternatively, set `EMAIL_PROVIDER=smtp` (the default) and configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and a verified sender in `EMAIL_FROM` or `SMTP_FROM`. A provider that does not require authentication may omit `SMTP_USER` and `SMTP_PASS`. The Admin page displays whether provider settings are present and has a **Send test email to me** action that sends only to the signed-in administrator. Use it to verify actual delivery before running **Send reminders now**, which can email every account with a due warranty. If email is not configured, the app previews reminders instead of claiming delivery; previewed reminders are not recorded as sent.

`REMINDER_CRON` controls the daily schedule and defaults to `0 9 * * *`. `REMINDER_TIMEZONE` controls the schedule timezone and defaults to `UTC` (for example, use `Asia/Kolkata` for India Standard Time). Set `APP_URL` to the public WarrantyVault URL to include an app link in reminder emails.

The scheduler runs inside the Node server process, so keep at least one backend instance running. If the hosting platform sleeps the server or runs it only as serverless functions, use an always-on worker or that platform's scheduled-job service to invoke the reminder job instead.

Users can turn reminders on or off and select their reminder window in **Settings → Email reminders**. An administrator can manually run the same due-reminder job from the Admin panel. The manual run respects user preferences and duplicate protection.

## Environment variable inventory

The server example covers all server variables used by the code: `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `APP_URL`, optional `ADMIN_EMAIL` and `ADMIN_PASSWORD` (set both or leave both blank), `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, optional `SENDGRID_API_KEY` fallback, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `REMINDER_CRON`, and `REMINDER_TIMEZONE`. Keep real secrets in your deployment's secret/environment settings, not in Git. The client has a separate [`client/.env.example`](../client/.env.example) for optional `VITE_API_URL`; blank uses the built-in development and production defaults. Vite's `import.meta.env.DEV` flag is supplied by Vite and should not be set manually.
