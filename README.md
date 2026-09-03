# Amravati Samvad — AI Grievance Redressal Portal

A full-stack municipal grievance system: citizens file complaints by chatting
with an AI assistant (English / Marathi / Hindi), complaints are auto-summarized
and auto-routed to the right department, department officers work a queue and
update status, and an admin can manage departments/officers and monitor everything.

## What's included

- **Citizen site**: landing page, login/register, AI chatbot complaint filing,
  guest filing, public tracking by Complaint ID, help/FAQ page, links to AMC's
  official portal.
- **AI chatbot**: powered by the free Gemini API. Talks naturally in the citizen's
  chosen language, asks only what's missing, and extracts a structured
  category + summary once it has enough information. Supports multiple API
  keys with automatic failover.
- **Auto department routing**: every complaint category maps to a department;
  new complaints are assigned automatically the moment they're submitted.
- **Officer dashboard**: each officer sees only their department's queue and
  can move a complaint through submitted → assigned → in_progress → resolved
  / rejected, with notes stored in a full status history.
- **Admin dashboard**: create/disable officer accounts, create departments,
  see stats (totals by status / by department), browse every complaint.
- **Location**: free OpenStreetMap-based map (Leaflet) + Nominatim search and
  reverse-geocoding + browser "use my current location" — no Google Maps
  billing required.
- **Database**: SQLite file (`server/data.sqlite`) — completely free, zero
  external account needed, and easy to swap for Postgres/MySQL later since
  all queries live in a few files.
- **Auth**: JWT + bcrypt-hashed passwords, role-based (`citizen`, `officer`,
  `admin`). Only admins can create officer/admin accounts — public
  registration always creates citizen accounts, so nobody can self-promote.

## Project layout

```
amravati-samvad/
  server/         Express API (SQLite, JWT auth, chatbot, complaints, admin)
    src/
      db.js               schema + seed data (departments + default admin)
      utils.js            tracking ID + auto department assignment
      middleware/auth.js  JWT verification, role guard
      routes/
        auth.js            register / login / me
        complaints.js      submit / track / list / update status / photo upload
        chatbot.js         Gemini-powered multilingual assistant
        admin.js           departments + officers CRUD, stats
        departmentsPublic.js
    .env.example
  client/         React + Vite + Tailwind frontend
    src/
      pages/       Landing, Login, Register, ChatComplaint, Track, Help,
                   OfficerDashboard, AdminDashboard
      components/  Navbar, Footer, LocationPicker, ProtectedRoute
      i18n.jsx     English / Marathi / Hindi UI strings
      context/AuthContext.jsx
```

## Running it locally

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:
- `JWT_SECRET` — any long random string.
- `GEMINI_API_KEYS` — one or more Google Gemini API keys, comma-separated
  (e.g. `AIzaSy...,AIzaSy...`). Get a **free** key (no credit card required)
  at https://aistudio.google.com/apikey. If you provide more than one, the
  chatbot automatically fails over to the next key if one hits a rate limit
  or error.

```bash
npm run dev      # or: node src/index.js
```

The API runs on `http://localhost:4000`. On first boot it creates
`data.sqlite`, seeds 6 departments, and prints a default admin login:

```
email: admin@amravati.gov.in
password: Admin@123
```

**Change this password immediately** (or delete `data.sqlite` and edit the
seed in `server/src/db.js` before first boot).

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173`. It talks to the API via `VITE_API_URL` in
`client/.env` (defaults to `http://localhost:4000/api`).

## Using the system

1. **As a citizen**: go to the landing page → "File a Complaint" → chat with
   the assistant in your language → the summary sidebar fills in as you talk
   → optionally pin your location and add photos → submit → you get a
   tracking ID like `AMC-2026-000123`.
2. **As an officer**: an admin creates your account against a department.
   Log in → `/officer` → see your department's queue → update status.
3. **As an admin**: log in with the seeded admin account → `/admin` → create
   departments and officers, watch stats, browse all complaints.

## Free-tier / cost notes

- **Database**: SQLite is a local file — $0, no account. If you later need
  multi-server deployment, swap in Postgres (e.g. Supabase or Neon free tier)
  by replacing `server/src/db.js`; the route files use plain SQL so the
  migration is mechanical.
- **Maps/location**: OpenStreetMap tiles + Nominatim are free for reasonable
  use (no API key). If you outgrow Nominatim's usage policy, MapTiler and
  LocationIQ both have generous free tiers as drop-in replacements.
- **AI**: the Gemini API's free tier (1,500 requests/day on Gemini Flash, no
  credit card) is plenty for a project like this. Everything
  else in this stack is free to host and run.
- **Hosting suggestions**: Render or Railway free/hobby tier for the Express
  API, Vercel or Netlify for the static React build. Both support a custom
  domain later.

## Security notes already built in

- Passwords hashed with bcrypt, never stored or returned in plain text.
- JWT-based auth with short-lived, role-scoped tokens.
- Officers can only see/update complaints in their own department
  (enforced server-side, not just hidden in the UI).
- Only admins can create officer/admin accounts — public `/register` always
  creates a citizen account.
- File uploads restricted to images/audio, 8MB limit, random filenames.

## Suggested next steps

- Add SMS/email notifications on status change (e.g. via a free-tier
  provider like Brevo or a WhatsApp Business API sandbox).
- Add a "forgot password" flow.
- Add pagination to the admin's "All Complaints" table once volume grows.
- Swap SQLite → Postgres if you deploy across multiple server instances.
