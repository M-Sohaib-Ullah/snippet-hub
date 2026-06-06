# Deploying SnippetHub — Vercel (frontend + API) + Supabase (Postgres + Storage)

**Architecture after migration**

- **Frontend:** the React/Vite app, built to static files and served by Vercel.
- **API:** our Express app, run as **Vercel Serverless Functions** (under `/api`).
- **Database:** **Supabase Postgres** (replaces the local SQLite file).
- **Avatar uploads:** **Supabase Storage** (replaces local disk).
- **Auth:** unchanged — our own JWT + bcrypt.

> Status: the database/storage **code migration** is done by Claude in the repo. Your job is the
> account setup below. Steps marked **(you)** need your logins; the rest is already in the code.

---

## Part 1 — Supabase (you)

1. Go to <https://supabase.com> → **New project**. Pick a name, a strong **database password**
   (save it), and a region close to you. Wait ~2 min for it to provision.
2. **Create the tables:** left sidebar → **SQL Editor** → **New query** → paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. You should see "Success".
3. **Create the avatars bucket:** sidebar → **Storage** → **New bucket** → name it exactly
   `avatars` → toggle **Public bucket ON** → **Create**. (The API also tries to create it
   automatically, but making it here is reliable.)
4. **Collect 3 secrets** (sidebar → **Project Settings**):
   - **API → Project URL** → this is `SUPABASE_URL`
   - **API → `service_role` secret** (click reveal) → this is `SUPABASE_SERVICE_KEY`
     ⚠️ Server-only. Never put this in the frontend.
   - **Connect** button (top bar) → **Direct → Connection string**, the **Transaction pooler**
     URI (port **6543**, host ends in `pooler.supabase.com`). Replace `[YOUR-PASSWORD]` with the
     DB password from step 1. This is `DATABASE_URL`.
     (The pooler is required because serverless opens many short-lived connections.)
     - ⚠️ **Do NOT append `?sslmode=require`** — newer `pg` reads that as full cert verification
       and fails on Supabase's self-signed chain. The app already enables SSL in code.
     - ⚠️ **If your password has special characters** (`/ & $ @ # : ?`), percent-encode them in
       the URL (`/`→`%2F`, `&`→`%26`, `$`→`%24`, `@`→`%40`, …) or, much simpler, **reset the DB
       password** (Settings → Database → Reset database password) to letters+digits only.

## Part 2 — Environment variables

You'll need these four. Keep them somewhere safe; you'll paste them into Vercel in Part 4.

```
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_KEY=<the secret key: sb_secret_… or the legacy service_role eyJ…>
JWT_SECRET=<any long random string>
```
(No `?sslmode=...` on the URL — SSL is enabled in code. Percent-encode special chars in the
password, or use an alphanumeric password.)

To verify locally before deploying: create `server/.env` with the four values above and run
`npm install && node seed-more.js && npm start` in `server/` — with `DATABASE_URL` set it
connects to Supabase Postgres (the same seed script works on SQLite and Postgres).
**Send me the `DATABASE_URL` + `SUPABASE_*` values (or just confirm they're set) and I'll run
the migrated server against your Supabase to verify everything before we touch Vercel.**

## Part 3 — Put the project in its own GitHub repo (you)

The project isn't in Git yet, and your existing repo is your whole home folder — so make a
clean, dedicated repo:

```powershell
cd "C:\Users\HP\Claude Projects\snippet-hub"
git init
git add .
git commit -m "SnippetHub: initial commit"
```

Then create an **empty** repo on GitHub (e.g. `snippet-hub`, no README), and:

```powershell
git remote add origin https://github.com/<you>/snippet-hub.git
git branch -M main
git push -u origin main
```

## Part 4 — Vercel (you)

1. Go to <https://vercel.com> → **Add New… → Project** → **Import** your `snippet-hub` repo.
2. **Framework Preset:** Vite. Leave build settings as-is — `vercel.json` in the repo already
   sets the build command and output directory, and routes `/api/*` to the serverless function.
3. **Environment Variables:** add the four from Part 2 (`DATABASE_URL`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY`, `JWT_SECRET`) for **Production** (and Preview if you want).
4. **Deploy.** When it finishes you'll get a `https://<project>.vercel.app` URL.

## Part 5 — Seed & test

- Seed demo data into Supabase once: locally with `server/.env` set, run
  `cd server && node seed-more.js` (it targets whatever `DATABASE_URL` points to).
- Open your Vercel URL, register an account, upload a snippet, like/comment/follow, upload an
  avatar (lands in Supabase Storage). Check **Supabase → Table editor** to see rows appear.

---

## How it maps to the code

| Concern | Local dev (before) | Vercel + Supabase (after) |
| --- | --- | --- |
| DB | `better-sqlite3` file | `pg` → Supabase Postgres (`DATABASE_URL`) |
| Avatars | multer → disk | `@supabase/supabase-js` → Storage `avatars` bucket |
| API process | `node index.js` | `api/index.js` exports the Express app as a Vercel function |
| Frontend API base | Vite proxy → `:4000` | same-origin `/api/*` on Vercel (no change needed) |

## Troubleshooting

- **500s on every API call:** usually `DATABASE_URL` wrong or not the **pooler** (port 6543).
- **`self-signed certificate in certificate chain`:** remove `?sslmode=require` from `DATABASE_URL`.
- **Connection parses wrong / auth fails for no reason:** unencoded special chars in the DB
  password (e.g. `/`, `&`, `$`). Percent-encode them or reset to an alphanumeric password.
- **Avatar upload fails:** the `avatars` bucket isn't **public**, or `SUPABASE_SERVICE_KEY` is missing.
- **"too many connections":** you used the direct DB string (port 5432) instead of the pooler.
- **Function timeouts/cold starts:** normal on the free tier for the first request.
