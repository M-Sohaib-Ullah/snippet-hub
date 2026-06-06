// Seeds demo users + ~23 snippets across many languages, plus follows, likes
// and comments. Works on whichever database is configured (SQLite locally, or
// Postgres/Supabase when DATABASE_URL is set). Idempotent.
//   node seed-more.js
import bcrypt from 'bcryptjs';
import { all, get, run } from './db.js';

const iso = (minutesAgo) => new Date(Date.now() - minutesAgo * 60000).toISOString();

async function ensureUser(username, email, bio) {
  const existing = await get('SELECT * FROM users WHERE username = ?', [username]);
  if (existing) {
    if (!existing.bio && bio) await run('UPDATE users SET bio = ? WHERE id = ?', [bio, existing.id]);
    return existing;
  }
  const password_hash = bcrypt.hashSync('password123', 10);
  const { id } = await get(
    'INSERT INTO users (username, email, password_hash, bio) VALUES (?, ?, ?, ?) RETURNING id',
    [username, email, password_hash, bio]
  );
  console.log(`+ user "${username}"`);
  return get('SELECT * FROM users WHERE id = ?', [id]);
}

const users = {
  demo: await ensureUser('demo', 'demo@example.com', 'Just here sharing handy snippets.'),
  ada: await ensureUser('ada', 'ada@example.com', 'Algorithms & clean code enthusiast.'),
  lin: await ensureUser('lin', 'lin@example.com', 'Frontend tinkerer — React, CSS, accessibility.'),
  marco: await ensureUser('marco', 'marco@example.com', 'Backend & databases. Go and Postgres.'),
  sara: await ensureUser('sara', 'sara@example.com', 'Python data wrangler.'),
  raj: await ensureUser('raj', 'raj@example.com', 'DevOps & shell wizardry.'),
  nori: await ensureUser('nori', 'nori@example.com', 'Rustacean and systems nerd.'),
};

const SNIPPETS = [
  ['lin', 'Copy text to clipboard', 'javascript', 'utility,dom,browser',
`async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}`],
  ['lin', 'Format bytes as human readable', 'javascript', 'utility,format',
`function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}`],
  ['demo', 'Deep clone an object', 'javascript', 'utility,objects',
`// structuredClone handles dates, maps, sets, arrays and nested objects.
const clone = (value) => structuredClone(value);

const original = { a: 1, nested: { b: [1, 2, 3] } };
const copy = clone(original);
copy.nested.b.push(4);
console.log(original.nested.b); // [1, 2, 3]`],
  ['lin', 'useLocalStorage React hook', 'javascript', 'react,hooks',
`import { useState } from 'react';

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initial;
  });

  const set = (next) => {
    setValue(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  return [value, set];
}`],
  ['lin', 'Type-safe event emitter', 'typescript', 'types,events',
`type Handler<T> = (payload: T) => void;

export class Emitter<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Handler<Events[K]>[] } = {};

  on<K extends keyof Events>(event: K, fn: Handler<Events[K]>) {
    (this.handlers[event] ??= []).push(fn);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    this.handlers[event]?.forEach((fn) => fn(payload));
  }
}`],
  ['marco', 'Result type helper', 'typescript', 'types,errors',
`export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });`],
  ['sara', 'Read a CSV into dicts', 'python', 'csv,io',
`import csv

def read_csv(path):
    with open(path, newline='') as f:
        return list(csv.DictReader(f))

rows = read_csv('data.csv')
print(rows[0])  # {'name': 'Ada', 'age': '36'}`],
  ['sara', 'Chunk a list into batches', 'python', 'list,utility',
`def chunk(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]

print(list(chunk([1, 2, 3, 4, 5], 2)))  # [[1, 2], [3, 4], [5]]`],
  ['sara', 'Retry decorator', 'python', 'decorator,resilience',
`import time
from functools import wraps

def retry(times=3, delay=1):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception:
                    if attempt == times - 1:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator`],
  ['sara', 'Deep-merge two dicts', 'python', 'dict,recursion',
`def deep_merge(a, b):
    out = dict(a)
    for key, value in b.items():
        if key in out and isinstance(out[key], dict) and isinstance(value, dict):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out`],
  ['marco', 'Worker pool', 'go', 'concurrency,goroutines',
`package main

import "sync"

func WorkerPool(jobs []int, workers int, do func(int) int) []int {
    results := make([]int, len(jobs))
    var wg sync.WaitGroup
    ch := make(chan int)

    for w := 0; w < workers; w++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for i := range ch {
                results[i] = do(jobs[i])
            }
        }()
    }
    for i := range jobs {
        ch <- i
    }
    close(ch)
    wg.Wait()
    return results
}`],
  ['marco', 'Write a JSON HTTP response', 'go', 'http,json',
`package main

import (
    "encoding/json"
    "net/http"
)

func WriteJSON(w http.ResponseWriter, status int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}`],
  ['nori', 'Read lines from a file', 'rust', 'io,files',
`use std::fs::File;
use std::io::{BufRead, BufReader};

fn read_lines(path: &str) -> std::io::Result<Vec<String>> {
    let file = File::open(path)?;
    BufReader::new(file).lines().collect()
}`],
  ['nori', 'Fibonacci with memoization', 'rust', 'algorithms,recursion',
`use std::collections::HashMap;

fn fib(n: u64, memo: &mut HashMap<u64, u64>) -> u64 {
    if n < 2 {
        return n;
    }
    if let Some(&v) = memo.get(&n) {
        return v;
    }
    let v = fib(n - 1, memo) + fib(n - 2, memo);
    memo.insert(n, v);
    v
}`],
  ['marco', 'Find duplicate rows', 'sql', 'database,query',
`SELECT email, COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;`],
  ['marco', 'Running total with a window function', 'sql', 'database,window',
`SELECT
    order_date,
    amount,
    SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders
ORDER BY order_date;`],
  ['raj', 'Kill the process on a port', 'bash', 'shell,devops',
`#!/usr/bin/env bash
# Usage: killport 3000
killport() {
  lsof -ti tcp:"$1" | xargs --no-run-if-empty kill -9
}`],
  ['raj', 'Timestamped folder backup', 'bash', 'shell,backup',
`#!/usr/bin/env bash
src="$1"
dest="\${2:-./backups}"
mkdir -p "$dest"
tar -czf "$dest/$(basename "$src")-$(date +%Y%m%d-%H%M%S).tar.gz" "$src"
echo "Backed up $src"`],
  ['lin', 'Truncate text with an ellipsis', 'css', 'css,layout',
`.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* multi-line clamp */
.clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}`],
  ['lin', 'Auto-fit responsive grid', 'css', 'css,grid,layout',
`.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}`],
  ['ada', 'Reverse the words in a sentence', 'java', 'strings,utility',
`String reverseWords(String input) {
    String[] words = input.trim().split("\\\\s+");
    Collections.reverse(Arrays.asList(words));
    return String.join(" ", words);
}`],
  ['nori', 'Sieve of Eratosthenes', 'cpp', 'algorithms,math',
`#include <vector>

std::vector<int> primes_up_to(int n) {
    std::vector<bool> sieve(n + 1, true);
    std::vector<int> primes;
    for (int p = 2; p <= n; ++p) {
        if (sieve[p]) {
            primes.push_back(p);
            for (int m = p * 2; m <= n; m += p) sieve[m] = false;
        }
    }
    return primes;
}`],
  ['lin', 'Accessible skip link', 'html', 'html,accessibility',
`<a class="skip-link" href="#main">Skip to content</a>
<!-- ...navigation... -->
<main id="main" tabindex="-1">
  <!-- page content -->
</main>`],
];

let added = 0;
for (let i = 0; i < SNIPPETS.length; i++) {
  const [author, title, language, tags, code] = SNIPPETS[i];
  const user = users[author];
  const exists = await get('SELECT id FROM snippets WHERE user_id = ? AND title = ?', [
    user.id,
    title,
  ]);
  if (exists) continue;
  const ts = iso(i * 47 + 10);
  await run(
    `INSERT INTO snippets (title, description, language, code, tags, user_id, created_at, updated_at)
     VALUES (?, '', ?, ?, ?, ?, ?, ?)`,
    [title, language, code, tags, user.id, ts, ts]
  );
  added++;
}
console.log(`+ ${added} new snippets (skipped ${SNIPPETS.length - added} already present)`);

// Follows
const follows = [
  ['demo', 'ada'], ['demo', 'lin'], ['demo', 'sara'],
  ['lin', 'demo'], ['lin', 'nori'],
  ['sara', 'ada'], ['sara', 'marco'],
  ['raj', 'marco'], ['nori', 'ada'], ['nori', 'marco'],
  ['marco', 'ada'], ['ada', 'sara'],
];
for (const [a, b] of follows) {
  await run(
    `INSERT INTO follows (follower_id, following_id) VALUES (?, ?)
     ON CONFLICT (follower_id, following_id) DO NOTHING`,
    [users[a].id, users[b].id]
  );
}

// Likes spread across snippets so counts vary (drives trending)
const allSnips = await all('SELECT id, user_id FROM snippets');
const roster = Object.values(users);
for (let i = 0; i < allSnips.length; i++) {
  const s = allSnips[i];
  const count = (i * 3 + 2) % 5;
  for (let k = 0; k < count; k++) {
    const liker = roster[(i + k + 1) % roster.length];
    if (liker.id !== s.user_id) {
      await run(
        `INSERT INTO likes (user_id, snippet_id) VALUES (?, ?)
         ON CONFLICT (user_id, snippet_id) DO NOTHING`,
        [liker.id, s.id]
      );
    }
  }
}

// A few comments
async function commentOnce(author, title, commenter, body) {
  const snip = await get(
    'SELECT s.id FROM snippets s JOIN users u ON u.id = s.user_id WHERE u.username = ? AND s.title = ?',
    [author, title]
  );
  if (!snip) return;
  const exists = await get(
    'SELECT id FROM comments WHERE snippet_id = ? AND user_id = ? AND body = ?',
    [snip.id, users[commenter].id, body]
  );
  if (exists) return;
  await run('INSERT INTO comments (snippet_id, user_id, body) VALUES (?, ?, ?)', [
    snip.id,
    users[commenter].id,
    body,
  ]);
}
await commentOnce('sara', 'Retry decorator', 'marco', 'Clean — I drop this into every project.');
await commentOnce('lin', 'useLocalStorage React hook', 'demo', 'Exactly what I needed, thanks!');
await commentOnce('marco', 'Worker pool', 'nori', 'Nice use of channels. 👌');
await commentOnce('nori', 'Sieve of Eratosthenes', 'ada', 'Classic. Fast and tidy.');

console.log('Done. All demo accounts use password: password123');
process.exit(0);
