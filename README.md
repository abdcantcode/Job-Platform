# Pipeline: job application tracker

Full-stack tracker built with React, Node.js, Express, MongoDB (Mongoose), JWT auth, node-cron and Nodemailer.

- JWT sign-up / sign-in
- Applications with a status timeline (applied, interview, offer, rejected). Every status change is stored inside the application document.
- Search, status and job-type filters, sorting, pagination (filters live in the URL, so they survive a refresh)
- Dashboard: applications, responses, interviews, offers, a pipeline funnel, weekly activity, follow-ups
- Daily email reminder for applications with no update for 7 days
- Light and dark mode (follows your system, remembers your choice)

## Run it

You need Node 20+ and a MongoDB connection string (a free Atlas cluster or a local `mongod`).

```bash
# 1. API
cd backend
npm install
# fill in backend/.env (see below)
npm run dev          # http://localhost:5000

# 2. Web app (second terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

## backend/.env

| Variable | What it is |
| --- | --- |
| `MONGO_URI` | **Required.** Your MongoDB connection string. |
| `JWT_SECRET` | **Required.** Any long random string. |
| `CLIENT_URL` | Frontend origin allowed by CORS. Default `http://localhost:5173`. Comma-separate several. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Email reminders. For Gmail use `smtp.gmail.com`, `587`, your address, and an **App Password** (needs 2-step verification). Leave blank to run without email. |
| `REMINDER_CRON` | When the reminder job runs. Default `0 9 * * *` (daily, 9:00). |
| `REMINDER_TZ` | Time zone for that schedule. Default `Asia/Kolkata`. |
| `REMINDER_STALE_DAYS` | Days without an update before a reminder. Default `7`. |

`frontend/.env` only has `VITE_API_URL` (default `http://localhost:5000/api`).

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## How reminders work

- A job runs on `REMINDER_CRON` and finds applications that are **applied** or **interview**, idle for `REMINDER_STALE_DAYS`, and not already reminded in that window.
- Each person gets **one digest email** listing their idle applications.
- Updating an application (status change or edit) restarts its clock.
- The job lives inside the API process, so reminders only go out while the server is running.

**Test your SMTP settings:** set `REMINDER_STALE_DAYS=0`, restart the API, sign in, then call (with your token):

```bash
curl -X POST http://localhost:5000/api/applications/reminders/run -H "Authorization: Bearer <token>"
```

Set it back to `7` afterwards.

## Structure

```
backend/
  server.js               start-up, DB connection, reminder job
  src/
    app.js                Express app (helmet, CORS, routes, errors)
    config/               env + database
    models/               User, Application (status history embedded)
    controllers/          thin request handlers
    services/             application logic, stats, mail, reminders
    middleware/           auth, errorHandler, notFound
    routes/               /api/auth, /api/applications
    utils/                ApiError, asyncHandler, token, validators
frontend/
  src/
    api/                  fetch client
    components/           layout, modal, form, badges, pagination
    context/              auth, theme, toasts
    pages/                login, register, dashboard, applications, detail
    styles/               theme tokens, layout, components
```

## API

All `/api/applications` routes need `Authorization: Bearer <jwt>`.

| Method | Path | |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/auth/me` | current user |
| GET | `/api/applications` | `?search&status&jobType&sort&page&limit` |
| GET | `/api/applications/stats` | dashboard numbers |
| POST | `/api/applications` | create |
| GET / PUT / DELETE | `/api/applications/:id` | read, update, delete |
| PATCH | `/api/applications/:id/status` | `{ status, note }` adds a timeline entry |
| POST | `/api/applications/reminders/run` | send your reminder digest now |
