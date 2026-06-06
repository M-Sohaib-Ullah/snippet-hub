// Vercel serverless entry: exposes the Express app as a function.
// Vercel routes every /api/* request here (see vercel.json), and Express
// matches the full path because its routes are mounted under /api/*.
import app from '../server/app.js';

export default app;
