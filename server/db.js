// Dual-mode database layer (serverless-safe: no top-level await).
//   - If DATABASE_URL is set  -> Postgres (Supabase) via `pg` (statically imported).
//   - Otherwise               -> local SQLite file via better-sqlite3 (lazy import).
//
// Same async API everywhere: all(), get(), run(). Queries use `?` placeholders
// (rewritten to $1,$2,… for Postgres). Inserts needing the new id end with
// `RETURNING id` (works on modern SQLite and Postgres).
import pg from 'pg';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DATABASE_URL } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const toPg = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

// ---- Postgres pool (created eagerly but connects lazily on first query) ----
const pool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 4,
    })
  : null;

// ---- SQLite (local dev only), initialized lazily on first use ----
let sqlitePromise = null;
function getSqlite() {
  if (!sqlitePromise) {
    sqlitePromise = (async () => {
      const mod = 'better-sqlite3'; // indirect specifier: not bundled by Vercel
      const { default: Database } = await import(mod);
      const dataDir = path.join(__dirname, 'data');
      fs.mkdirSync(dataDir, { recursive: true });
      const db = new Database(path.join(dataDir, 'snippethub.db'));
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          bio TEXT NOT NULL DEFAULT '',
          avatar TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS snippets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          language TEXT NOT NULL,
          code TEXT NOT NULL,
          tags TEXT NOT NULL DEFAULT '',
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          forked_from INTEGER REFERENCES snippets(id) ON DELETE SET NULL,
          downloads INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS likes (
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          snippet_id INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (user_id, snippet_id)
        );
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          snippet_id INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          body TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS follows (
          follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (follower_id, following_id)
        );
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          snippet_id INTEGER REFERENCES snippets(id) ON DELETE CASCADE,
          is_read INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS collection_items (
          collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
          snippet_id INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
          added_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (collection_id, snippet_id)
        );
        CREATE INDEX IF NOT EXISTS idx_snippets_user ON snippets(user_id);
        CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
        CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at);
        CREATE INDEX IF NOT EXISTS idx_comments_snippet ON comments(snippet_id);
        CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
        CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
        CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
      `);
      const ensureColumn = (table, column, definition) => {
        const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
        if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
      };
      ensureColumn('users', 'bio', "bio TEXT NOT NULL DEFAULT ''");
      ensureColumn('users', 'avatar', 'avatar TEXT');
      ensureColumn('snippets', 'forked_from', 'forked_from INTEGER REFERENCES snippets(id)');
      return db;
    })();
  }
  return sqlitePromise;
}

export async function all(sql, params = []) {
  if (pool) return (await pool.query(toPg(sql), params)).rows;
  const db = await getSqlite();
  return db.prepare(sql).all(...params);
}

export async function get(sql, params = []) {
  if (pool) return (await pool.query(toPg(sql), params)).rows[0];
  const db = await getSqlite();
  return db.prepare(sql).get(...params);
}

export async function run(sql, params = []) {
  if (pool) {
    const r = await pool.query(toPg(sql), params);
    return { rowCount: r.rowCount, rows: r.rows };
  }
  const db = await getSqlite();
  const info = db.prepare(sql).run(...params);
  return { rowCount: info.changes, lastInsertRowid: info.lastInsertRowid, rows: [] };
}
