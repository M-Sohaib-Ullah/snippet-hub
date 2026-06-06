// Builds and exports the Express app WITHOUT starting a listener, so it can be
// used both by the local dev server (index.js) and as a Vercel serverless
// function (../api/index.js).
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import snippetRoutes from './routes/snippets.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import collectionRoutes from './routes/collections.js';
import { avatarsDir } from './storage.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Local avatar files. On Vercel/Supabase, avatars are served from Supabase
// Storage instead, so this static mount is harmless (the dir is just empty).
app.use('/api/avatars', express.static(avatarsDir, { maxAge: '1d' }));

app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/collections', collectionRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

export default app;
