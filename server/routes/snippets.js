import express from 'express';
import { all, get, run } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { isValidLanguage, extensionFor, LANGUAGES } from '../languages.js';
import { SELECT_SNIPPET, shapeSnippet } from '../snippetQuery.js';
import { createNotification } from '../notify.js';
import { h } from '../asyncHandler.js';

const router = express.Router();

// Normalize a free-form tag string into a clean, comma-separated list.
function normalizeTags(raw) {
  return [
    ...new Set(
      String(raw || '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    ),
  ]
    .slice(0, 10)
    .join(',');
}

// GET /api/snippets/languages
router.get('/languages', requireAuth, (_req, res) => {
  res.json(Object.entries(LANGUAGES).map(([key, v]) => ({ key, label: v.label, ext: v.ext })));
});

// GET /api/snippets/tags  — all tags with usage counts.
router.get(
  '/tags',
  requireAuth,
  h(async (_req, res) => {
    const rows = await all("SELECT tags FROM snippets WHERE tags <> ''");
    const counts = new Map();
    for (const { tags } of rows) {
      for (const tag of tags.split(',')) {
        if (tag) counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    const result = [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    res.json(result);
  })
);

// GET /api/snippets  — browse / search / filter.
router.get(
  '/',
  requireAuth,
  h(async (req, res) => {
    const { q, language, tag, author, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;
    const uid = req.user?.id || 0;

    const where = [];
    const params = [];

    if (q) {
      // LOWER(...) keeps search case-insensitive on Postgres (whose LIKE is
      // case-sensitive) as well as SQLite. Tags are already stored lowercase.
      where.push(
        '(LOWER(s.title) LIKE ? OR LOWER(s.description) LIKE ? OR LOWER(s.code) LIKE ? OR s.tags LIKE ?)'
      );
      const like = `%${String(q).toLowerCase()}%`;
      params.push(like, like, like, like);
    }
    if (language) {
      where.push('s.language = ?');
      params.push(String(language));
    }
    if (tag) {
      where.push('(s.tags = ? OR s.tags LIKE ? OR s.tags LIKE ? OR s.tags LIKE ?)');
      const t = String(tag).toLowerCase();
      params.push(t, `${t},%`, `%,${t},%`, `%,${t}`);
    }
    if (author) {
      where.push('u.username = ?');
      params.push(String(author));
    }
    if (req.query.mine === 'true') {
      if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
      where.push('s.user_id = ?');
      params.push(req.user.id);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql =
      sort === 'downloads'
        ? 'ORDER BY s.downloads DESC, s.created_at DESC'
        : sort === 'likes'
        ? 'ORDER BY like_count DESC, s.created_at DESC'
        : sort === 'trending'
        ? // Inline the subqueries (Postgres can't use SELECT aliases inside a
          // compound ORDER BY expression the way SQLite can).
          `ORDER BY (
             (SELECT COUNT(*) FROM likes l WHERE l.snippet_id = s.id) * 3 +
             (SELECT COUNT(*) FROM comments c WHERE c.snippet_id = s.id) * 2 +
             s.downloads
           ) DESC, s.created_at DESC`
        : sort === 'oldest'
        ? 'ORDER BY s.created_at ASC'
        : 'ORDER BY s.created_at DESC';

    const { n: total } = await get(
      `SELECT COUNT(*) AS n FROM snippets s JOIN users u ON u.id = s.user_id ${whereSql}`,
      params
    );

    const rows = await all(`${SELECT_SNIPPET} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`, [
      uid,
      ...params,
      limit,
      offset,
    ]);

    res.json({
      snippets: rows.map(shapeSnippet),
      total: Number(total),
      page,
      limit,
      pages: Math.ceil(Number(total) / limit) || 1,
    });
  })
);

// GET /api/snippets/feed  — snippets from people the current user follows.
router.get(
  '/feed',
  requireAuth,
  h(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;
    const uid = req.user.id;

    const followWhere =
      'WHERE s.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)';

    const { n: total } = await get(
      `SELECT COUNT(*) AS n FROM snippets s ${followWhere}`,
      [uid]
    );

    const rows = await all(
      `${SELECT_SNIPPET} ${followWhere} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      [uid, uid, limit, offset]
    );

    res.json({
      snippets: rows.map(shapeSnippet),
      total: Number(total),
      page,
      limit,
      pages: Math.ceil(Number(total) / limit) || 1,
    });
  })
);

// GET /api/snippets/:id
router.get(
  '/:id',
  requireAuth,
  h(async (req, res) => {
    const uid = req.user?.id || 0;
    const row = await get(`${SELECT_SNIPPET} WHERE s.id = ?`, [uid, req.params.id]);
    if (!row) return res.status(404).json({ error: 'Snippet not found.' });
    res.json(shapeSnippet(row));
  })
);

// GET /api/snippets/:id/download
router.get(
  '/:id/download',
  requireAuth,
  h(async (req, res) => {
    const row = await get('SELECT * FROM snippets WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Snippet not found.' });

    await run('UPDATE snippets SET downloads = downloads + 1 WHERE id = ?', [row.id]);

    const safeName =
      (row.title || 'snippet').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') ||
      'snippet';
    const filename = `${safeName}.${extensionFor(row.language)}`;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(row.code);
  })
);

// POST /api/snippets  — create (auth required).
router.post(
  '/',
  requireAuth,
  h(async (req, res) => {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const language = String(req.body.language || '').trim();
    const code = String(req.body.code ?? '');
    const tags = normalizeTags(req.body.tags);

    if (!title) return res.status(400).json({ error: 'A title is required.' });
    if (!isValidLanguage(language))
      return res.status(400).json({ error: 'Please choose a supported language.' });
    if (!code.trim()) return res.status(400).json({ error: 'Code cannot be empty.' });

    const { id } = await get(
      `INSERT INTO snippets (title, description, language, code, tags, user_id)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      [title, description, language, code, tags, req.user.id]
    );

    const row = await get(`${SELECT_SNIPPET} WHERE s.id = ?`, [req.user.id, id]);
    res.status(201).json(shapeSnippet(row));
  })
);

// POST /api/snippets/:id/fork
router.post(
  '/:id/fork',
  requireAuth,
  h(async (req, res) => {
    const source = await get('SELECT * FROM snippets WHERE id = ?', [req.params.id]);
    if (!source) return res.status(404).json({ error: 'Snippet not found.' });

    const { id } = await get(
      `INSERT INTO snippets (title, description, language, code, tags, user_id, forked_from)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [source.title, source.description, source.language, source.code, source.tags, req.user.id, source.id]
    );

    await createNotification({
      recipientId: source.user_id,
      actorId: req.user.id,
      type: 'fork',
      snippetId: source.id,
    });

    const row = await get(`${SELECT_SNIPPET} WHERE s.id = ?`, [req.user.id, id]);
    res.status(201).json(shapeSnippet(row));
  })
);

// PUT /api/snippets/:id  — update (owner only).
router.put(
  '/:id',
  requireAuth,
  h(async (req, res) => {
    const existing = await get('SELECT * FROM snippets WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Snippet not found.' });
    if (existing.user_id !== req.user.id)
      return res.status(403).json({ error: 'You can only edit your own snippets.' });

    const title = String(req.body.title ?? existing.title).trim();
    const description = String(req.body.description ?? existing.description).trim();
    const language = String(req.body.language ?? existing.language).trim();
    const code = String(req.body.code ?? existing.code);
    const tags = normalizeTags(req.body.tags ?? existing.tags);

    if (!title) return res.status(400).json({ error: 'A title is required.' });
    if (!isValidLanguage(language))
      return res.status(400).json({ error: 'Please choose a supported language.' });
    if (!code.trim()) return res.status(400).json({ error: 'Code cannot be empty.' });

    await run(
      `UPDATE snippets
       SET title = ?, description = ?, language = ?, code = ?, tags = ?, updated_at = ?
       WHERE id = ?`,
      [title, description, language, code, tags, new Date().toISOString(), existing.id]
    );

    const row = await get(`${SELECT_SNIPPET} WHERE s.id = ?`, [req.user.id, existing.id]);
    res.json(shapeSnippet(row));
  })
);

// DELETE /api/snippets/:id
router.delete(
  '/:id',
  requireAuth,
  h(async (req, res) => {
    const existing = await get('SELECT * FROM snippets WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Snippet not found.' });
    if (existing.user_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own snippets.' });

    await run('DELETE FROM snippets WHERE id = ?', [existing.id]);
    res.json({ ok: true });
  })
);

// ---------------- Likes ----------------

router.post(
  '/:id/like',
  requireAuth,
  h(async (req, res) => {
    const snippet = await get('SELECT id, user_id FROM snippets WHERE id = ?', [req.params.id]);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });

    const result = await run(
      `INSERT INTO likes (user_id, snippet_id) VALUES (?, ?)
       ON CONFLICT (user_id, snippet_id) DO NOTHING`,
      [req.user.id, snippet.id]
    );
    if (result.rowCount > 0) {
      await createNotification({
        recipientId: snippet.user_id,
        actorId: req.user.id,
        type: 'like',
        snippetId: snippet.id,
      });
    }
    const { n } = await get('SELECT COUNT(*) AS n FROM likes WHERE snippet_id = ?', [snippet.id]);
    res.json({ likedByMe: true, likeCount: Number(n) });
  })
);

router.delete(
  '/:id/like',
  requireAuth,
  h(async (req, res) => {
    await run('DELETE FROM likes WHERE user_id = ? AND snippet_id = ?', [
      req.user.id,
      req.params.id,
    ]);
    const { n } = await get('SELECT COUNT(*) AS n FROM likes WHERE snippet_id = ?', [
      req.params.id,
    ]);
    res.json({ likedByMe: false, likeCount: Number(n) });
  })
);

// ---------------- Comments ----------------

router.get(
  '/:id/comments',
  requireAuth,
  h(async (req, res) => {
    const rows = await all(
      `SELECT c.id, c.body, c.created_at, c.user_id, u.username AS author
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.snippet_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        body: r.body,
        author: r.author,
        authorId: r.user_id,
        createdAt: r.created_at,
      }))
    );
  })
);

router.post(
  '/:id/comments',
  requireAuth,
  h(async (req, res) => {
    const snippet = await get('SELECT id, user_id FROM snippets WHERE id = ?', [req.params.id]);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });

    const body = String(req.body.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Comment cannot be empty.' });
    if (body.length > 1000)
      return res.status(400).json({ error: 'Comment is too long (max 1000 characters).' });

    const { id } = await get(
      'INSERT INTO comments (snippet_id, user_id, body) VALUES (?, ?, ?) RETURNING id',
      [snippet.id, req.user.id, body]
    );

    await createNotification({
      recipientId: snippet.user_id,
      actorId: req.user.id,
      type: 'comment',
      snippetId: snippet.id,
    });

    const row = await get(
      `SELECT c.id, c.body, c.created_at, c.user_id, u.username AS author
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [id]
    );

    res.status(201).json({
      id: row.id,
      body: row.body,
      author: row.author,
      authorId: row.user_id,
      createdAt: row.created_at,
    });
  })
);

router.delete(
  '/:id/comments/:commentId',
  requireAuth,
  h(async (req, res) => {
    const comment = await get('SELECT * FROM comments WHERE id = ?', [req.params.commentId]);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (comment.user_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own comments.' });

    await run('DELETE FROM comments WHERE id = ?', [comment.id]);
    res.json({ ok: true });
  })
);

export default router;
