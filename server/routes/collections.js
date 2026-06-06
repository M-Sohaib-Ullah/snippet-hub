import express from 'express';
import { all, get, run } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { SELECT_SNIPPET, shapeSnippet } from '../snippetQuery.js';
import { h } from '../asyncHandler.js';

const router = express.Router();

function shapeCollection(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    owner: row.owner,
    ownerId: row.user_id,
    itemCount: Number(row.item_count ?? 0),
    createdAt: row.created_at,
  };
}

const SELECT_COLLECTION = `
  SELECT c.*, u.username AS owner,
    (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS item_count
  FROM collections c
  JOIN users u ON u.id = c.user_id
`;

// GET /api/collections/user/:username  — a user's collections.
router.get(
  '/user/:username',
  requireAuth,
  h(async (req, res) => {
    const user = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const rows = await all(
      `${SELECT_COLLECTION} WHERE c.user_id = ? ORDER BY c.created_at DESC`,
      [user.id]
    );
    res.json(rows.map(shapeCollection));
  })
);

// GET /api/collections/mine?snippetId=  — current user's collections (+ membership flag).
router.get(
  '/mine',
  requireAuth,
  h(async (req, res) => {
    const rows = await all(
      `${SELECT_COLLECTION} WHERE c.user_id = ? ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    const snippetId = req.query.snippetId ? Number(req.query.snippetId) : null;
    let includedIds = new Set();
    if (snippetId) {
      const items = await all(
        'SELECT collection_id FROM collection_items WHERE snippet_id = ?',
        [snippetId]
      );
      includedIds = new Set(items.map((r) => r.collection_id));
    }
    res.json(rows.map((r) => ({ ...shapeCollection(r), included: includedIds.has(r.id) })));
  })
);

// GET /api/collections/:id  — a single collection with its snippets.
router.get(
  '/:id',
  requireAuth,
  h(async (req, res) => {
    const row = await get(`${SELECT_COLLECTION} WHERE c.id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Collection not found.' });
    const uid = req.user?.id || 0;
    const snippets = await all(
      `${SELECT_SNIPPET}
       JOIN collection_items ci ON ci.snippet_id = s.id
       WHERE ci.collection_id = ?
       ORDER BY ci.added_at DESC`,
      [uid, req.params.id]
    );
    res.json({ ...shapeCollection(row), snippets: snippets.map(shapeSnippet) });
  })
);

// POST /api/collections  — create a collection.
router.post(
  '/',
  requireAuth,
  h(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    if (!name) return res.status(400).json({ error: 'A collection name is required.' });
    if (name.length > 80) return res.status(400).json({ error: 'Name is too long.' });

    const { id } = await get(
      'INSERT INTO collections (user_id, name, description) VALUES (?, ?, ?) RETURNING id',
      [req.user.id, name, description]
    );
    const row = await get(`${SELECT_COLLECTION} WHERE c.id = ?`, [id]);
    res.status(201).json(shapeCollection(row));
  })
);

// DELETE /api/collections/:id  — owner only.
router.delete(
  '/:id',
  requireAuth,
  h(async (req, res) => {
    const col = await get('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (!col) return res.status(404).json({ error: 'Collection not found.' });
    if (col.user_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own collections.' });
    await run('DELETE FROM collections WHERE id = ?', [col.id]);
    res.json({ ok: true });
  })
);

// POST /api/collections/:id/items  — add a snippet (owner only).
router.post(
  '/:id/items',
  requireAuth,
  h(async (req, res) => {
    const col = await get('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (!col) return res.status(404).json({ error: 'Collection not found.' });
    if (col.user_id !== req.user.id)
      return res.status(403).json({ error: 'You can only modify your own collections.' });

    const snippetId = Number(req.body.snippetId);
    const snippet = await get('SELECT id FROM snippets WHERE id = ?', [snippetId]);
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });

    await run(
      `INSERT INTO collection_items (collection_id, snippet_id) VALUES (?, ?)
       ON CONFLICT (collection_id, snippet_id) DO NOTHING`,
      [col.id, snippetId]
    );
    res.json({ ok: true });
  })
);

// DELETE /api/collections/:id/items/:snippetId  — remove a snippet (owner only).
router.delete(
  '/:id/items/:snippetId',
  requireAuth,
  h(async (req, res) => {
    const col = await get('SELECT * FROM collections WHERE id = ?', [req.params.id]);
    if (!col) return res.status(404).json({ error: 'Collection not found.' });
    if (col.user_id !== req.user.id)
      return res.status(403).json({ error: 'You can only modify your own collections.' });

    await run('DELETE FROM collection_items WHERE collection_id = ? AND snippet_id = ?', [
      col.id,
      req.params.snippetId,
    ]);
    res.json({ ok: true });
  })
);

export default router;
