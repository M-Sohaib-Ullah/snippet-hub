// Avatar storage: Supabase Storage when configured, else the local disk.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const avatarsDir = path.join(__dirname, 'data', 'avatars');
fs.mkdirSync(avatarsDir, { recursive: true });

export const useSupabase = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
const BUCKET = 'avatars';

let _client = null;
async function client() {
  if (!_client) {
    const { createClient } = await import('@supabase/supabase-js');
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    // Best-effort: make sure the bucket exists and is public.
    try {
      await _client.storage.createBucket(BUCKET, { public: true });
    } catch {
      /* already exists */
    }
  }
  return _client;
}

// Stores the avatar and returns the value to save in users.avatar:
//   - Supabase: a full public URL
//   - local:    a bare filename (served from /api/avatars/<file>)
export async function saveAvatar({ filename, buffer, contentType, previous }) {
  if (useSupabase) {
    const c = await client();
    const { error } = await c.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType, upsert: true });
    if (error) throw new Error(error.message);
    const { data } = c.storage.from(BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  }
  // local disk
  fs.writeFileSync(path.join(avatarsDir, filename), buffer);
  if (previous && !previous.startsWith('http') && previous !== filename) {
    fs.promises.unlink(path.join(avatarsDir, previous)).catch(() => {});
  }
  return filename;
}
