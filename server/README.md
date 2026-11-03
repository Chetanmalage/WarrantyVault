# WarrantyVault server notifications

## Automated warranty email notifications

The reminder job checks accounts with email reminders enabled, selects products expiring within each account's chosen 1–90 day window, and sends one digest per account. Delivery records prevent repeat messages for the same product, window, and expiry date. Users can manage reminders under **Settings → Email reminders**; an administrator can run a manual reminder check from the Admin page.

Configure delivery in the backend environment, never in source control. For Resend, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` using a sender on a domain verified in Resend. The shared `resend.dev` sender is test-only; WarrantyVault blocks bulk reminders while it is configured. Send a test message to the signed-in administrator after verifying your domain. Optionally set `SENDGRID_API_KEY` as a fallback and verify the same sender with SendGrid. Keep provider keys only in Render's secret settings. If delivery is unconfigured, messages are previewed and not recorded as sent.

## Frontend production environment

The frontend and backend are typically deployed separately (Vercel frontend + Render backend). In that case `VITE_API_URL` https://warrantyvault-16et.onrender.com/api **must** be set on the frontend host so the client can reach the backend. Example:
