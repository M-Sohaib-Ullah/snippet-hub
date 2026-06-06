-- SnippetHub — Postgres schema for Supabase.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- It is safe to re-run (uses IF NOT EXISTS).

create table if not exists users (
  id            bigint generated always as identity primary key,
  username      text not null unique,
  email         text not null unique,
  password_hash text not null,
  bio           text not null default '',
  avatar        text,
  created_at    timestamptz not null default now()
);

create table if not exists snippets (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text not null default '',
  language    text not null,
  code        text not null,
  tags        text not null default '',
  user_id     bigint not null references users(id) on delete cascade,
  forked_from bigint references snippets(id) on delete set null,
  downloads   integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists likes (
  user_id    bigint not null references users(id) on delete cascade,
  snippet_id bigint not null references snippets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, snippet_id)
);

create table if not exists comments (
  id         bigint generated always as identity primary key,
  snippet_id bigint not null references snippets(id) on delete cascade,
  user_id    bigint not null references users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create table if not exists follows (
  follower_id  bigint not null references users(id) on delete cascade,
  following_id bigint not null references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table if not exists notifications (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id) on delete cascade,
  actor_id   bigint not null references users(id) on delete cascade,
  type       text not null,
  snippet_id bigint references snippets(id) on delete cascade,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists collections (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references users(id) on delete cascade,
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists collection_items (
  collection_id bigint not null references collections(id) on delete cascade,
  snippet_id    bigint not null references snippets(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, snippet_id)
);

create index if not exists idx_snippets_user on snippets(user_id);
create index if not exists idx_snippets_language on snippets(language);
create index if not exists idx_snippets_created on snippets(created_at);
create index if not exists idx_comments_snippet on comments(snippet_id);
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);
create index if not exists idx_notifications_user on notifications(user_id, is_read);
create index if not exists idx_collections_user on collections(user_id);

-- ROW-LEVEL SECURITY:
-- The Express API talks to Postgres as the `postgres` owner role (via
-- DATABASE_URL), which BYPASSES RLS — so the app works whether or not RLS is on.
-- When Supabase asks, choose "Run and enable RLS": with RLS enabled and NO
-- policies, the public auto-generated REST API (anon key) can't touch these
-- tables, while the app keeps full access. That's the safest setup here.
-- (If you ever switch to the Supabase-native/client-direct approach, you'll then
-- need to add explicit RLS policies.)
