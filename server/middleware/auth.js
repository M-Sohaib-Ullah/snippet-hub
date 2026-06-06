import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

function readToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return null;
}

// Rejects the request with 401 if there is no valid token.
export function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

// Attaches req.user when a valid token is present, but never blocks the request.
export function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = { id: payload.id, username: payload.username };
    } catch {
      /* ignore invalid token for optional auth */
    }
  }
  next();
}
