import express from 'express';
import multer from 'multer';
import { all, get, run } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { createNotification } from '../notify.js';
import { saveAvatar } from '../storage.js';
import { h } from '../asyncHandler.js';

const router = express.Router();

const ALLOWED_IMAGE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

// Keep uploads in memory; storage.js decides where the bytes go.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, !!ALLOWED_IMAGE[file.mimetype]),
});

// PATCH /api/users/me  — update the current user's bio.
router.patch(
  '/me',
  requireAuth,
  h(async (req, res) => {
    const bio = String(req.body.bio ?? '').trim().slice(0, 300);
    await run('UPDATE users SET bio = ? WHERE id = ?', [bio, req.user.id]);
    const user = await get('SELECT username, bio, avatar FROM users WHERE id = ?', [req.user.id]);
    res.json({ username: user.username, bio: user.bio, avatar: user.avatar });
  })
);

// POST /api/users/me/avatar  — upload/replace the current user's avatar.
router.post(
  '/me/avatar',
  requireAuth,
  upload.single('avatar'),
  h(async (req, res) => {
    if (!req.file)
      return res
        .status(400)
        .json({ error: 'Please choose a PNG, JPG, GIF or WEBP image (max 2 MB).' });

    const ext = ALLOWED_IMAGE[req.file.mimetype] || 'png';
    const filename = `u${req.user.id}_${Date.now()}.${ext}`;
    const prev = (await get('SELECT avatar FROM users WHERE id = ?', [req.user.id]))?.avatar;

    const stored = await saveAvatar({
      filename,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      previous: prev,
    });

    await run('UPDATE users SET avatar = ? WHERE id = ?', [stored, req.user.id]);
    res.json({ avatar: stored });
  })
);

// GET /api/users/:username  — profile with stats (auth required).
router.get(
  '/:username',
  requireAuth,
  h(async (req, res) => {
    const user = await get(
      'SELECT id, username, bio, avatar, created_at FROM users WHERE username = ?',
      [req.params.username]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { n: snippetCount } = await get(
      'SELECT COUNT(*) AS n FROM snippets WHERE user_id = ?',
      [user.id]
    );
    const { n: followerCount } = await get(
      'SELECT COUNT(*) AS n FROM follows WHERE following_id = ?',
      [user.id]
    );
    const { n: followingCount } = await get(
      'SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?',
      [user.id]
    );

    let isFollowing = false;
    const isMe = req.user?.id === user.id;
    if (req.user && !isMe) {
      isFollowing = !!(await get(
        'SELECT 1 AS x FROM follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, user.id]
      ));
    }

    res.json({
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.created_at,
      snippetCount: Number(snippetCount),
      followerCount: Number(followerCount),
      followingCount: Number(followingCount),
      isFollowing,
      isMe,
    });
  })
);

// POST /api/users/:username/follow
router.post(
  '/:username/follow',
  requireAuth,
  h(async (req, res) => {
    const target = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.id === req.user.id)
      return res.status(400).json({ error: "You can't follow yourself." });

    const result = await run(
      `INSERT INTO follows (follower_id, following_id) VALUES (?, ?)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [req.user.id, target.id]
    );
    if (result.rowCount > 0) {
      await createNotification({ recipientId: target.id, actorId: req.user.id, type: 'follow' });
    }

    const { n: followerCount } = await get(
      'SELECT COUNT(*) AS n FROM follows WHERE following_id = ?',
      [target.id]
    );
    res.json({ isFollowing: true, followerCount: Number(followerCount) });
  })
);

// DELETE /api/users/:username/follow
router.delete(
  '/:username/follow',
  requireAuth,
  h(async (req, res) => {
    const target = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    await run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [
      req.user.id,
      target.id,
    ]);

    const { n: followerCount } = await get(
      'SELECT COUNT(*) AS n FROM follows WHERE following_id = ?',
      [target.id]
    );
    res.json({ isFollowing: false, followerCount: Number(followerCount) });
  })
);

// GET /api/users/:username/followers
router.get(
  '/:username/followers',
  requireAuth,
  h(async (req, res) => {
    const user = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const rows = await all(
      `SELECT u.username, u.avatar FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = ? ORDER BY f.created_at DESC`,
      [user.id]
    );
    res.json(rows);
  })
);

// GET /api/users/:username/following
router.get(
  '/:username/following',
  requireAuth,
  h(async (req, res) => {
    const user = await get('SELECT id FROM users WHERE username = ?', [req.params.username]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const rows = await all(
      `SELECT u.username, u.avatar FROM follows f JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = ? ORDER BY f.created_at DESC`,
      [user.id]
    );
    res.json(rows);
  })
);

export default router;
