# Wall

A simple, responsive wall built with Next.js, Tailwind CSS, shadcn/ui, and Supabase. Write a message of up to 280 characters and optionally upload a photo. New posts automatically use the profile name configured in `src/lib/wall.ts` and appear first. Realtime updates and a 15-second polling fallback refresh the feed without reloading.

## Run locally

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

If `.env.local` already exists, keep it. Add your project's values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use the publishable key (or legacy anon key), never a secret/service-role key. Restart the dev server after changing environment variables. Open http://localhost:3000.

## Supabase setup: database, storage, and Realtime

1. Open the same Supabase project used in `.env.local`.
2. Open **SQL Editor ? New query**.
3. Paste the complete contents of [`supabase/setup.sql`](supabase/setup.sql) and click **Run**. The script supports both a new database and the `posts` table shown in the reference screenshot. Existing rows are retained; existing posts receive the default author name `Guest`.
4. In **Table Editor ? posts**, confirm the columns below exist.
5. In **Storage**, confirm the bucket **`wall-photos`** exists and is public.
6. Reload the app once after setup. Share a message, then share one with a small JPG. Open a second browser tab to verify that the post appears automatically.

The SQL also enables Row Level Security, adds read/insert policies, and adds `posts` to the `supabase_realtime` publication. It can be rerun. Inspect existing policies if you previously configured broader access; this script replaces only its own named policies.

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | uuid | Generated post ID |
| `user_id` | uuid, nullable | Reserved for future account support; guest posts use null |
| `author_name` | text | Configured profile name, separate from the message (1–60 characters) |
| `body` | text | Message (up to 280 Unicode characters) |
| `created_at` | timestamptz | Database-generated timestamp |
| `photo_url` | text, nullable | Public URL of the uploaded photo |

Messages can contain text, a photo, or both. New posts use `profile.name` automatically; existing posts retain their stored author names. This is a configured display name, not an authenticated identity. Anyone can read the wall and submit posts/photos. These policies do not grant visitors edit, delete, or overwrite access. The sample posts from Anna and friends are local fixtures and are labeled as examples; they are not inserted into your database. The app displays the latest 100 stored posts above the examples.

## Storage bucket and upload errors

**Bucket name: `wall-photos`** (lowercase, with a hyphen).

The setup SQL creates this bucket with:

- **Public bucket:** enabled, so shared photos can be displayed.
- **Maximum file size:** 5 MB (`5242880` bytes).
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/gif`.
- **INSERT policy:** allows guest uploads to `wall-photos/posts/` for the `anon` and `authenticated` roles.

If you prefer creating the bucket manually, use **Storage ? New bucket**, enter `wall-photos`, enable **Public bucket**, and set those limits. You must still run the storage policy section of `supabase/setup.sql`: making a bucket public allows viewing; it does not grant upload permission.

If uploading fails:

1. **Bucket not found:** confirm `wall-photos` exists in the project identified by your environment variables.
2. **Row-level security / permission denied:** run the storage INSERT policy in the setup SQL. The database INSERT policy for `posts` is separate and also required.
3. **File too large / unsupported MIME:** choose a JPG, PNG, or GIF up to 5 MB. HEIC is not supported; export it as JPG first.
4. **Schema cache / author_name missing:** run the complete setup SQL to add the separate name column.
5. **Network error:** check your connection and retry. The form retains the draft. If an upload succeeded but inserting its post failed, retrying reuses that photo while the draft remains open. Abandoned drafts may leave unused uploaded files; remove these manually from Storage if needed.

Upload errors show Supabase's returned error message to help identify the cause.

## Make it yours

Edit `src/lib/wall.ts` to set your profile name, bio, city, and profile-photo path. Replace `public/profile-placeholder.svg` with your own image, or add `public/profile.jpg` and set `profile.photo` to `/profile.jpg`. Desktop profile photos are deliberately larger than the reference (260–282 pixels wide); the mobile layout keeps the photo next to the profile details.

Edit the sample messages in the same file. Layout styling lives in `src/app/globals.css`. Add shadcn/ui components with `npx shadcn@latest add input dialog`.

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Unit tests use Node's built-in TypeScript stripping (Node 22.18+). Browser tests use the installed Microsoft Edge, a separate `.next-e2e` build cache, and mocked Supabase responses; they do not write to your project. They cover publishing, photo-only posts, upload/insert failures, retrying uploads, automatic feed refresh, and mobile overflow. After building, run `npm start` to serve the production app.

## References

- [Supabase standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Postgres changes](https://supabase.com/docs/guides/realtime/postgres-changes)
