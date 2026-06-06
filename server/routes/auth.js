import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run } from '../db.js';
import { JWT_SECRET } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { h } from '../asyncHandler.js';

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email, avatar: user.avatar };
}

// POST /api/auth/register
router.post(
  '/register',
  h(async (req, res) => {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (username.length < 3)
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const exists = await get('SELECT id FROM users WHERE username = ? OR email = ?', [
      username,
      email,
    ]);
    if (exists)
      return res.status(409).json({ error: 'That username or email is already taken.' });

    const password_hash = await bcrypt.hash(password, 10);
    const { id } = await get(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?) RETURNING id',
      [username, email, password_hash]
    );
    const user = await get('SELECT * FROM users WHERE id = ?', [id]);

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  h(async (req, res) => {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await get('SELECT * FROM users WHERE lower(username) = ? OR email = ?', [
      identifier,
      identifier,
    ]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  h(async (req, res) => {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: publicUser(user) });
  })
);

export default router;
