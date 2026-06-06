import { run } from './db.js';

// Insert a notification for `recipientId` about something `actorId` did.
// No-ops when the actor is the recipient (don't notify yourself).
export async function createNotification({ recipientId, actorId, type, snippetId = null }) {
  if (!recipientId || recipientId === actorId) return;
  await run(
    'INSERT INTO notifications (user_id, actor_id, type, snippet_id) VALUES (?, ?, ?, ?)',
    [recipientId, actorId, type, snippetId]
  );
}
