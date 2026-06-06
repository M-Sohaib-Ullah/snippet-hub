import express from 'express';
import { all, get, run } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { h } from '../asyncHandler.js';

const router = express.Router();

// GET /api/notifications  — current user's notifications (newest first).
router.get(
  '/',
  requireAuth,
  h(async (req, res) => {
    const rows = await all(
      `SELECT n.id, n.type, n.is_read, n.created_at, n.snippet_id,
              a.username AS actor, a.avatar AS actor_avatar,
              s.title AS snippet_title
       FROM notifications n
       JOIN users a ON a.id = n.actor_id
       LEFT JOIN snippets s ON s.id = n.snippet_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const { n: unread } = await get(
      'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = false',
      [req.user.id]
    );

    res.json({
      unread: Number(unread),
      notifications: rows.map((r) => ({
        id: r.id,
        type: r.type,
        isRead: !!r.is_read,
        actor: r.actor,
        actorAvatar: r.actor_avatar,
        snippetId: r.snippet_id,
        snippetTitle: r.snippet_title,
        createdAt: r.created_at,
      })),
    });
  })
);

// GET /api/notifications/unread-count
router.get(
  '/unread-count',
  requireAuth,
  h(async (req, res) => {
    const { n } = await get(
      'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = false',
      [req.user.id]
    );
    res.json({ unread: Number(n) });
  })
);

// POST /api/notifications/read  — mark all as read.
router.post(
  '/read',
  requireAuth,
  h(async (req, res) => {
    await run('UPDATE notifications SET is_read = true WHERE user_id = ?', [req.user.id]);
    res.json({ ok: true });
  })
);

export default router;
