# Youth Empowerment Hub

Youth Empowerment Hub is a Vite/React public platform with a protected Express + SQLite administration API. It publishes real opportunities without making unsupported claims or duplicating Google Form applications.

## Architecture

- `src/` — responsive public website, role pages, application handoff modal, and admin workspace.
- `src/config/applicationLinks.js` — one client-side fallback for the public Google Form destinations.
- `server/` — Express API, SQLite schema/seeding, signed admin sessions, rate limiting, audit logging and resource routes.
- `server/db/schema.sql` — relational schema for public content, form links, administrators, sessions and future application records.

The public client calls `/api/public/home`. If the API is not running, it displays carefully worded fallback content and clear empty states; it never fabricates metrics, events, testimonials or announcements.

## Local setup

1. Copy `.env.example` to `.env` and set a unique `JWT_SECRET`, `ADMIN_EMAIL`, and strong `ADMIN_PASSWORD` before the first server run.
2. Install dependencies with `npm install`.
3. Start the public app and API together with `npm run dev:full`.
4. Open `http://localhost:5173`; the API listens at `http://localhost:3001`.

For a production-style single service, run `npm run build`, then `npm run server`. The Express app serves `dist/` and its API from the same origin.

## First administrator

The database is created and seeded on first server launch. Its administrator is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. There are no committed credentials. Change the initial password immediately after login and set `NODE_ENV=production`, `COOKIE_SECURE=true`, and a long random `JWT_SECRET` before deployment.

## Form links

The admin API exposes form links at `/api/admin/form-links`; public clients use only enabled links. All application buttons first show a review dialog, then open a configured HTTPS form URL in a new tab. Campus Ambassador can remain in the `Coming Soon` state until an official form is available.

## Security checklist

- Use a unique, high-entropy production `JWT_SECRET` and strong initial administrator password.
- Serve over HTTPS; set `COOKIE_SECURE=true` in production.
- Restrict `CORS_ORIGIN` to the deployed frontend origin.
- Do not expose `.env` or `server/db/yeh.db`; both are ignored by Git.
- Review audit logs, failed sign-ins, and active sessions regularly.
- Back up the SQLite database with an encrypted, access-controlled process while the application is quiescent or through SQLite's backup API.
- Never place server passwords, database credentials, or private API keys in `VITE_*` variables.

## Verification

- `npm run build` validates the Vite frontend bundle.
- `npm run server` initializes the database and starts the API.
- `GET /api/health` returns the server health state.
