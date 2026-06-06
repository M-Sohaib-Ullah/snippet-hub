# SnippetHub

A platform where people can **upload code snippets**, and others can **browse, view,
copy, and download** them to reuse in their own projects.

Built with a **React (Vite)** frontend and a **Node/Express + SQLite** API.

## Features

- 🔐 **User accounts** — sign up / log in (JWT-based auth, bcrypt-hashed passwords)
- 📤 **Upload snippets** — title, description, language, tags, and code
- 🔍 **Search & filter** — full-text search plus filter by language and tag, sort by newest / oldest / most downloaded / most liked
- 🎨 **Syntax highlighting** — 20+ languages via Prism, with a raw-view toggle
- ⬇ **Download** — grab any snippet as a properly-extensioned source file (e.g. `debounce.js`)
- 📋 **Copy to clipboard** — one-click copy
- ❤️ **Likes** — like snippets; sort the browse page by most-liked
- 💬 **Comments** — discuss snippets in a comment thread (delete your own)
- ⑂ **Fork** — copy someone's snippet into your own account, with "forked from" attribution
- 👥 **Follow & feed** — follow other users and see their latest snippets in a personalized feed (Twitter/Instagram style)
- 🪪 **Public profiles** — `/u/:username` pages with avatar, bio, snippet/follower/following counts, and a Follow button
- 🔔 **Notifications** — get notified when someone likes, comments on, forks, or follows you (unread badge in the navbar)
- 🔖 **Collections / bookmarks** — save snippets into named collections, shown on your profile
- 🖼️ **Editable profile + avatars** — edit your bio and upload an avatar image (PNG/JPG/GIF/WEBP)
- 🔥 **Explore & tags** — a trending page (Trending / Most liked / Most downloaded / Newest) and a tag cloud at `/tags`
- 🌗 **Dark / light theme** — toggle in the navbar, remembered across visits
- ✏️ **Manage your own** — edit and delete snippets you own

## Project structure

```
snippet-hub/
├── server/          # Express API + SQLite database
│   ├── index.js         # app entry / route mounting
│   ├── db.js            # SQLite connection + schema
│   ├── config.js        # env config (JWT secret, port)
│   ├── languages.js     # supported languages + file extensions
│   ├── middleware/auth.js
│   ├── routes/auth.js       # register / login / me
│   ├── routes/snippets.js   # CRUD + search + download
│   └── seed-more.js     # optional sample data (users, snippets, likes…)
└── client/          # React + Vite frontend
    └── src/
        ├── pages/       # Home, SnippetDetail, New/Edit, Login, Register, Profile
        ├── components/  # Navbar, SnippetCard, CodeView, SnippetForm, ProtectedRoute
        ├── context/     # AuthContext
        └── api.js       # fetch wrapper
```

## Prerequisites

You need **Node.js 18 or newer** (which includes `npm`). It is not currently installed on
this machine — download it from <https://nodejs.org> (the "LTS" build), install it, then
**open a new terminal** so `node` is on your PATH. Verify with:

```powershell
node --version
npm --version
```

## Setup & run

Open **two terminals** — one for the API, one for the frontend.

### 1. Backend (API)

```powershell
cd "C:\Users\HP\Claude Projects\snippet-hub\server"
npm install
Copy-Item .env.example .env      # then edit .env and set a real JWT_SECRET
node seed-more.js                # optional: demo users + ~23 sample snippets
npm start                        # API runs on http://localhost:4000
```

> **Database:** with no `DATABASE_URL` set, the API uses a local **SQLite** file
> (`server/data/`). Set `DATABASE_URL` (+ `SUPABASE_*`) to use **Supabase Postgres** instead —
> see [`DEPLOY.md`](DEPLOY.md) for hosting on Vercel + Supabase.

`seed-more.js` creates demo users (**`demo`**, **`ada`**, `lin`, `marco`, `sara`, `raj`, `nori` —
all password `password123`) with ~23 snippets, follows, likes and comments, so the **Feed**,
**Explore** and **notifications** have content right away.

### 2. Frontend (React app)

```powershell
cd "C:\Users\HP\Claude Projects\snippet-hub\client"
npm install
npm run dev                      # app runs on http://localhost:5173
```

Then open **http://localhost:5173** in your browser. The Vite dev server proxies
`/api/*` requests to the backend automatically, so you don't need to configure URLs.

## API overview

| Method | Endpoint                              | Auth | Description                         |
| ------ | ------------------------------------- | ---- | ----------------------------------- |
| POST   | `/api/auth/register`                  | —    | Create an account                   |
| POST   | `/api/auth/login`                     | —    | Log in, returns a token             |
| GET    | `/api/auth/me`                        | ✓    | Current user                        |
| GET    | `/api/snippets`                       | ·    | List / search / filter (paginated)  |
| GET    | `/api/snippets/feed`                  | ✓    | Snippets from people you follow     |
| GET    | `/api/snippets/:id`                   | ·    | Single snippet                      |
| GET    | `/api/snippets/:id/download`          | —    | Download as a source file           |
| POST   | `/api/snippets`                       | ✓    | Create a snippet                    |
| POST   | `/api/snippets/:id/fork`              | ✓    | Fork into your account              |
| PUT    | `/api/snippets/:id`                   | ✓    | Update (owner only)                 |
| DELETE | `/api/snippets/:id`                   | ✓    | Delete (owner only)                 |
| POST   | `/api/snippets/:id/like`              | ✓    | Like a snippet                      |
| DELETE | `/api/snippets/:id/like`              | ✓    | Remove your like                    |
| GET    | `/api/snippets/:id/comments`          | —    | List comments                       |
| POST   | `/api/snippets/:id/comments`          | ✓    | Add a comment                       |
| DELETE | `/api/snippets/:id/comments/:cid`     | ✓    | Delete your comment                 |
| GET    | `/api/users/:username`                | ·    | Public profile + stats              |
| POST   | `/api/users/:username/follow`         | ✓    | Follow a user                       |
| DELETE | `/api/users/:username/follow`         | ✓    | Unfollow a user                     |
| GET    | `/api/users/:username/followers`      | —    | List followers                      |
| GET    | `/api/users/:username/following`      | —    | List who they follow                |
| PATCH  | `/api/users/me`                       | ✓    | Update your bio                     |
| POST   | `/api/users/me/avatar`                | ✓    | Upload avatar (multipart `avatar`)  |
| GET    | `/api/snippets/tags`                  | —    | All tags with usage counts          |
| GET    | `/api/notifications`                  | ✓    | Your notifications + unread count    |
| GET    | `/api/notifications/unread-count`     | ✓    | Unread badge count                  |
| POST   | `/api/notifications/read`             | ✓    | Mark all as read                    |
| GET    | `/api/collections/user/:username`     | —    | A user's collections                |
| GET    | `/api/collections/mine?snippetId=`    | ✓    | Your collections (+ membership flag) |
| GET    | `/api/collections/:id`                | ·    | A collection with its snippets      |
| POST   | `/api/collections`                    | ✓    | Create a collection                 |
| DELETE | `/api/collections/:id`                | ✓    | Delete a collection (owner)         |
| POST   | `/api/collections/:id/items`          | ✓    | Add a snippet to a collection       |
| DELETE | `/api/collections/:id/items/:sid`     | ✓    | Remove a snippet from a collection  |

(✓ = required, · = optional — uses the token if present, e.g. to compute `likedByMe`.)
The `sort` param also accepts `trending`. Uploaded avatars are served from `/api/avatars/<file>`.

Query params for `GET /api/snippets`: `q`, `language`, `tag`, `author`, `sort`
(`newest` \| `oldest` \| `downloads` \| `likes`), `mine=true` (with auth), `page`, `limit`.

## Notes

- The SQLite database file is created automatically at `server/data/snippethub.db`.
- For production you'd want to set a strong `JWT_SECRET`, serve the built frontend
  (`npm run build` in `client/`) behind the API or a static host, and add rate limiting.
