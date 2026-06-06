import 'dotenv/config';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
export const PORT = Number(process.env.PORT) || 4000;

// When DATABASE_URL is set the app uses Postgres (Supabase); otherwise it
// falls back to a local SQLite file for development.
export const DATABASE_URL = process.env.DATABASE_URL || '';

// Supabase Storage (for avatar uploads). When unset, avatars are stored on
// the local disk instead.
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
