# SkillKita

SkillKita is a web-based training and course management system for **TRSC**. It helps visitors discover courses, lets employers request quotations and submit documents, and gives administrators tools to manage courses, users, quotations, and communications.

## Overview

| Role | What they can do |
|------|------------------|
| **Visitor** | View company pages, browse courses, download course documents, and ask the AI course assistant |
| **Employer** | Request quotations, track/download approved PDFs, submit JD14 and payment receipts, chat with admin, receive notifications |
| **Administrator** | Manage courses and landing content, extract course fields from posters (AI), review quotations/documents, manage users, message employers |

**Tech stack:** React + TypeScript + Vite, Tailwind CSS, Supabase (Auth, PostgreSQL, Storage, RLS), Vercel serverless APIs, Google Gemini 2.5 Flash (poster extraction + course assistant).

**Repository:** https://github.com/deenadeeya/skillkita

---

## Setup Manual

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm (comes with Node.js)
- A [Supabase](https://supabase.com/) project
- (Optional) A [Google AI Studio](https://aistudio.google.com/apikey) API key for Gemini features
- (Optional) Supabase CLI for migrations (`npx supabase`)

### 1. Clone the repository

```bash
git clone https://github.com/deenadeeya/skillkita.git
cd skillkita/skillkita-web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon/publishable key (RLS-bound) |
| `GEMINI_API_KEY` | For AI features | Server-only key for poster extraction and course assistant |
| `SUPABASE_SECRET_KEY` | For admin employer CRUD | Server-only secret key (`sb_secret_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional alternative | Legacy service-role key if secret key is not used |

Do **not** commit real secret values. Do **not** prefix `GEMINI_API_KEY` or `SUPABASE_SECRET_KEY` with `VITE_` (that would expose them to the browser).

### 4. Set up the database

From `skillkita-web`:

```bash
npx supabase link
npx supabase db push
```

Or run the SQL files in [`supabase/migrations/`](supabase/README.md) manually in the Supabase SQL Editor (in filename order).

Then create an admin user in **Supabase → Authentication**, and promote them:

```sql
update public.user_profiles
set role = 'admin', status = 'approved', approved_at = now()
where user_id = '<your-auth-user-uuid>';
```

### 5. Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

Local API routes (`/api/extract-poster`, `/api/course-assistant`, `/api/admin-employers`) are proxied by Vite using the same handlers as Vercel.

### 6. Build for production (optional check)

```bash
npm run build
npm run preview
```

---

## Deploy to Vercel

1. Import the repository in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `skillkita-web` (recommended).
3. Add environment variables for Production (and Preview if needed):  
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`.
4. Deploy. SPA routes are rewritten to `index.html`; Supabase calls go through `/supabase-api`.
5. In **Supabase → Authentication → URL Configuration**, set **Site URL** and **Redirect URLs** to your Vercel domain (e.g. `https://your-app.vercel.app`).

---

## Project structure (brief)

| Path | Purpose |
|------|---------|
| `src/routes/` | Public, auth, employer, and admin pages |
| `src/features/` | Feature modules (courses, quotation, chat, submissions, etc.) |
| `api/` | Serverless APIs (poster extract, course assistant, admin employers) |
| `supabase/migrations/` | Database schema, RLS policies, storage buckets |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
