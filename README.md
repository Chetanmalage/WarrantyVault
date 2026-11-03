# WarrantyVault

WarrantyVault is a web app for keeping product details, warranty dates, repair history, and supporting documents together. Users can review upcoming expirations, manage service records, and receive optional warranty reminder emails.

## Features

- Register and sign in with JWT-based authentication.
- Add, edit, and view products and their warranty information.
- Track service records and upload product photos and documents.
- View warranty calendars, expiring warranties, and warranty history.
- Review dashboard statistics and reports.
- Configure email reminders; administrators can manage users and trigger reminder checks.

## Tech stack

- **Client:** React 18, Vite, React Router, Bootstrap
- **Server:** Node.js, Express, Mongoose
- **Database:** MongoDB

## Requirements

- Node.js 20 or later
- npm
- A MongoDB instance, local or hosted

## Local development

1. Configure the server environment in `server/.env`:

   ```dotenv
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/warrantyvault
   JWT_SECRET=replace-with-a-long-random-secret
   CLIENT_URL=http://localhost:5173
   ```

   `MONGO_URI` and `JWT_SECRET` are required. To create an administrator on first startup, also set `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The account is only created if that email does not already exist.

2. Install server dependencies and start the API:

   ```bash
   cd server
   npm install
   npm run dev
   ```

   The API runs on `http://localhost:5000` by default. Its root endpoint (`/`) returns a status response.

3. In a separate terminal, install client dependencies and start Vite:

   ```bash
   cd client
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. During local development the client uses `http://localhost:5000/api` by default. Set `VITE_API_URL` in `client/.env.local` if your API runs at a different address, for example:

   ```dotenv
   VITE_API_URL=http://localhost:5000/api
   ```

Keep environment files and credentials out of source control. The repository's `.gitignore` excludes local environment files.

## Optional email reminders

Reminder delivery is not required to run the app. Configure a mail provider in `server/.env` to send real emails. For Resend, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` using a sender address on a verified domain. Other supported configuration includes SMTP, SendGrid, and Brevo; see [server/README.md](./server/README.md) for provider-specific notes.

The in-process reminder scheduler is enabled by default. Set `REMINDER_SCHEDULER_ENABLED=false` to disable it, or configure `REMINDER_CRON` and `REMINDER_TIMEZONE` to change its schedule. A protected reminder endpoint can also be called by an external scheduler; configure `REMINDER_CRON_SECRET` for that use.

## Tests and production build

Run the frontend tests and build:

```bash
cd client
npm test
npm run build
```

Run the backend tests:

```bash
cd server
npm test
```

The frontend production build is written to `client/dist`. Start the server outside development mode with `npm start` from `server/`.

## API areas

- `/api/auth` — registration, login, and current user
- `/api/products` — products and warranty information
- `/api/services` — service records
- `/api/documents` — supporting documents
- `/api/dashboard` — dashboard data
- `/api/reports` — reports and analytics
- `/api/admin` — administrator operations
- `/api/internal` — protected internal jobs, including reminder checks

## Deployment

The client and server can be deployed separately. Set `VITE_API_URL` on the frontend to the deployed API base URL ending in `/api`, and set `CLIENT_URL` on the server to the deployed frontend origin. Configure database, JWT, and mail credentials as deployment secrets. The client includes a Vercel rewrite for the single-page app; the server's reminder setup and deployment notes are in [server/README.md](./server/README.md).
