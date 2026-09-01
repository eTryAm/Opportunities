# Production Deployment Guide — Opportunities Portal
**Platform Architecture:** React (Vercel) + Node/Express (Render) + Turso (libSQL/SQLite) + Cloudinary (Persistent Photos)

---

## 1. Architecture Overview

```text
                    INTERNET
                       │
                       ▼
              ┌─────────────────┐
              │ React Frontend  │  (Hosted on Vercel)
              │ (Vite SPA Edge) │
              └────────┬────────┘
                       │ HTTPS / REST API
                       ▼
              ┌─────────────────┐
              │ Express.js API  │  (Hosted on Render Web Service)
              │  (Node.js v20+) │
              └────────┬────────┘
                       │
              ┌────────┴─────────┐
              ▼                  ▼
       ┌──────────────┐   ┌─────────────────┐
       │    Turso     │   │   Cloudinary    │
       │ (libSQL / DB)│   │ (Photos Storage)│
       └──────────────┘   └─────────────────┘
```

* **Frontend:** Hosted on **Vercel** for fast global CDN delivery and automatic SSL. Handled by client-side SPA routing (`vercel.json`).
* **Backend:** Hosted on **Render** as a Web Service running Express.js with automated health checks (`/health`).
* **Database:** **Turso** (SQLite-compatible libSQL database). Your data persists permanently across all Render restarts and deployments.
* **Photo Storage:** **Cloudinary** for persistent, cloud-hosted community member ID card photos.
* **Opportunities Intake:** Standard **Google Forms** integration is preserved for candidate submissions.

---

## 2. Environment Variables Reference

| Variable | Target Platform | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Render** | Node environment mode | `production` |
| `PORT` | **Render** | Server listen port | `3001` (or Render default) |
| `JWT_SECRET` | **Render** | 32+ char secret for admin tokens | `generate_random_secret_here` |
| `ADMIN_EMAIL` | **Render** | Initial administrator email | `admin@youthempowermenthub.org` |
| `ADMIN_PASSWORD` | **Render** | Initial administrator password | `YourSecurePassword123!` |
| `TURSO_DATABASE_URL` | **Render** | Production Turso database URL | `libsql://your-db-name.turso.io` |
| `TURSO_AUTH_TOKEN` | **Render** | Turso authentication token | `eyJhbGciOi...` |
| `CLOUDINARY_CLOUD_NAME` | **Render** | Cloudinary account cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | **Render** | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | **Render** | Cloudinary API Secret | `abcdefghijklmnopqrstuvwx` |
| `FRONTEND_URL` | **Render** | Production Vercel domain for CORS | `https://your-frontend.vercel.app` |
| `CORS_ORIGIN` | **Render** | CORS allowed origin | `https://your-frontend.vercel.app` |
| `COOKIE_SECURE` | **Render** | Enforce HTTPS cookies | `true` |
| `COOKIE_SAME_SITE` | **Render** | Cross-site cookie attribute | `none` |
| `VITE_API_BASE_URL` | **Vercel** | Backend Render API base URL | `https://your-backend.onrender.com` |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Push Code to GitHub
Ensure all recent changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: migrate to Turso, Cloudinary, and production architecture"
git push origin main
```

---

### Step 2: Create Your Persistent Database on Turso
Turso provides a free tier with 9GB of storage and 500 databases.
1. Sign up / Log in to [Turso](https://turso.tech/).
2. Create a new database (e.g. named `yeh-production`):
   * Via web dashboard: Click **Create Database** → Name: `yeh-production` → Select your preferred region.
   * Or via Turso CLI:
     ```bash
     turso db create yeh-production
     ```
3. Copy your database URL:
   * It looks like: `libsql://yeh-production-[username].turso.io`
4. Generate an authentication token:
   * Web dashboard: Click your database → **Settings** or **Tokens** → **Create Token**.
   * Or via CLI:
     ```bash
     turso db tokens create yeh-production
     ```

---

### Step 3: Run the Database Migration
Migrate your local data (`server/db/yeh.db`) directly to your new Turso database:

1. In your local terminal, run the migration command passing your Turso credentials:
   ```bash
   $env:TURSO_DATABASE_URL="libsql://yeh-production-[username].turso.io"
   $env:TURSO_AUTH_TOKEN="your-turso-token-here"
   npm run db:migrate
   ```
2. The migration script will:
   * Create all tables, indexes, and constraints from `schema.sql`.
   * Copy all records (admins, site settings, opportunities, events, announcements, testimonials, FAQs, impact stats, social links, community members).
   * Verify target row counts match your local database.

---

### Step 4: Set Up Cloudinary (Photo Storage)
Cloudinary provides a generous free tier for images.
1. Sign up at [Cloudinary](https://cloudinary.com/).
2. Go to your **Dashboard**.
3. Under **Product Environment Credentials**, copy:
   * **Cloud Name**
   * **API Key**
   * **API Secret**

---

### Step 5: Deploy the Backend API to Render
1. Go to [Render](https://render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository (`eTryAm/Opportunities`).
3. Configure the service settings:
   * **Name:** `yeh-backend` (or your chosen name)
   * **Region:** Nearest region to your users (e.g. Singapore, Frankfurt, or Oregon)
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`
4. Expand **Advanced** → **Environment Variables**, and add:
   * `NODE_ENV` = `production`
   * `PORT` = `10000` (Render assigns its own port automatically, but this is a standard default)
   * `JWT_SECRET` = `(generate a strong 32+ character random string)`
   * `ADMIN_EMAIL` = `admin@youthempowermenthub.org`
   * `ADMIN_PASSWORD` = `(your strong admin password)`
   * `TURSO_DATABASE_URL` = `(your Turso URL from Step 2)`
   * `TURSO_AUTH_TOKEN` = `(your Turso token from Step 2)`
   * `CLOUDINARY_CLOUD_NAME` = `(from Step 4)`
   * `CLOUDINARY_API_KEY` = `(from Step 4)`
   * `CLOUDINARY_API_SECRET` = `(from Step 4)`
   * `FRONTEND_URL` = `https://your-app.vercel.app` *(update this after Step 6 if needed)*
   * `CORS_ORIGIN` = `https://your-app.vercel.app`
   * `COOKIE_SECURE` = `true`
   * `COOKIE_SAME_SITE` = `none`
5. Click **Create Web Service**.
6. Once deployed, test the health check in your browser:
   `https://your-backend.onrender.com/health` (should return `{"status":"ok", ...}`).

---

### Step 6: Deploy the Frontend to Vercel
1. Go to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Import your GitHub repository (`eTryAm/Opportunities`).
3. Configure Project Settings:
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Install Command:** `npm install`
4. In **Environment Variables**, add:
   * `VITE_API_BASE_URL` = `https://your-backend.onrender.com` *(use your actual Render backend URL)*
5. Click **Deploy**.
6. Vercel will build and assign you a URL (e.g. `https://opportunities-xyz.vercel.app`).

---

### Step 7: Final CORS Handshake
1. Copy your Vercel deployment URL (e.g. `https://opportunities.vercel.app`).
2. Go back to Render → your Web Service → **Environment**.
3. Update `FRONTEND_URL` and `CORS_ORIGIN` to match your exact Vercel URL.
4. Render will automatically redeploy with the updated CORS configuration.

---

## 4. Production Verification Checklist

Run through these checks to ensure full production readiness:

- [ ] **Health Check:** Open `https://your-backend.onrender.com/health` → returns `{ "status": "ok" }`.
- [ ] **Public Homepage:** Open your Vercel URL → hero, opportunities, events, and stats render with live data.
- [ ] **Community Registration:**
  - Fill out the form at `/join-community` with a test name, phone, location, and photo.
  - Verify that registration succeeds and generates a `YEH-XXXXXX` Member ID.
  - Verify that the profile photo uploads to Cloudinary and appears on the ID card.
  - Click **Download ID Card** → verify PNG downloads cleanly.
- [ ] **Member ID Verification:**
  - Switch to "View my ID Card" / Login at `/join-community` and enter the Member ID.
  - Verify your profile and photo load correctly.
- [ ] **Admin Panel:**
  - Navigate to `/admin/login`.
  - Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
  - Check the Dashboard metrics, Community Members table, and Opportunities list.
- [ ] **Google Sheets Opportunity Sync:**
  - In Admin → Applications → click **Sync from Sheet**.
  - Provide a Google Sheet URL and sync → verify records populate.
- [ ] **Data Persistence:**
  - In Render Dashboard, click **Manual Deploy** → **Deploy latest commit** (simulating server restart).
  - Re-check `/join-community` member lookup to confirm data and images remain 100% intact.

---

## 5. Rollback Procedure

If you ever need to run the application locally with SQLite without Turso:
1. Simply unset `TURSO_DATABASE_URL` in your `.env` file (or comment it out).
2. The database adapter will automatically fall back to local `server/db/yeh.db`.
3. If Cloudinary variables are commented out, photos will automatically save to `server/uploads/community_photos/`.
