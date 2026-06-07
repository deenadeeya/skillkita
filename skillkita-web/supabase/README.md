# Supabase database setup

All schema lives in `migrations/` as numbered SQL files. Run them **in filename order** (oldest timestamp first).

## Quick start (recommended)

From the `skillkita-web` directory:

```bash
npx supabase link          # once, pick your Supabase project
npx supabase db push       # applies all pending migrations
```

## Manual setup (SQL Editor)

If you prefer the Supabase Dashboard SQL Editor, open each file below and run it in order:

| # | File | What it sets up |
|---|------|-----------------|
| 1 | `migrations/20260501000001_extensions.sql` | PostgreSQL extensions |
| 2 | `migrations/20260501000002_core_content.sql` | `courses`, `experiences`, `landing_content` |
| 3 | `migrations/20260501000003_auth_and_profiles.sql` | Auth profiles, roles, RLS, signup triggers |
| 4 | `migrations/20260501000004_storage_buckets.sql` | Storage buckets + public asset policies |
| 5 | `migrations/20260501000005_course_private_files.sql` | Course document metadata + private storage |
| 6 | `migrations/20260501000006_quotations.sql` | Quotation requests + PDF storage |
| 7 | `migrations/20260501000007_employer_submissions.sql` | JD14 / payment submissions + templates |
| 8 | `migrations/20260501000008_chat.sql` | Employer ↔ admin chat |
| 9 | `migrations/20260501000009_notifications.sql` | In-app notifications (chat, quotes, docs) |
| 10 | `migrations/20260501000010_homepage_cms.sql` | Homepage hero, stats, gallery, etc. |

## After migrations

1. **Create your admin user** in Supabase Authentication (email/password or OAuth).
2. **Promote to admin** — in the SQL Editor:

```sql
update public.user_profiles
set role = 'admin', status = 'approved', approved_at = now()
where user_id = '<your-auth-user-uuid>';
```

3. Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` point to this project.

## Storage buckets

Migration `20260501000004_storage_buckets.sql` creates all required buckets automatically:

| Bucket | Public? | Used for |
|--------|---------|----------|
| `course-posters` | Yes | Course poster images |
| `profile-pics` | Yes | User profile photos |
| `site-assets` | Yes | Landing / About Us images |
| `experience-photos` | Yes | Experience gallery |
| `course-private-files` | No | Syllabus, tentative, trainer docs |
| `employer-documents` | No | JD14, payment receipts, templates |
| `quotation-pdfs` | No | Generated quotation PDFs |
| `chat-attachments` | No | Chat file uploads |

## Existing databases

If your project already ran the **old** migration files (timestamps starting with `20260514`–`20260606`), do **not** re-run this baseline on top of it. Your schema should already be up to date. These consolidated migrations are for **new** Supabase projects only.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "new row violates row-level security policy" on signup | Re-run `20260501000003_auth_and_profiles.sql` (creates the signup trigger) |
| Admin actions fail with RLS errors | Ensure your user has `role = 'admin'` and `status = 'approved'` in `user_profiles` |
| `jd14_submission_templates` not found in API | Re-run `20260501000007_employer_submissions.sql`, then `NOTIFY pgrst, 'reload schema';` |
| Quotation PDF upload fails | Confirm `quotation-pdfs` bucket exists (migration 4) and migration 6 ran |
