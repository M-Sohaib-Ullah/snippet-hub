import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Avatar from '../components/Avatar.jsx';
import { timeAgo } from '../time.js';

const VERBS = {
  like: 'liked your snippet',
  comment: 'commented on your snippet',
  fork: 'forked your snippet',
  follow: 'started following you',
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .notifications()
      .then((d) => setItems(d.notifications))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // Mark everything read once the page is opened.
    api.markNotificationsRead().catch(() => {});
  }, []);

  return (
    <div className="narrow-wide">
      <h1>Notifications</h1>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <div className="alert">{error}</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>No notifications yet.</p>
          <p className="muted">When people like, comment, fork or follow you, it shows up here.</p>
        </div>
      ) : (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n.id} className={`notif ${n.isRead ? '' : 'unread'}`}>
              <Link to={`/u/${n.actor}`}>
                <Avatar username={n.actor} avatar={n.actorAvatar} size={36} />
              </Link>
              <div className="notif-body">
                <span>
                  <Link to={`/u/${n.actor}`} className="notif-actor">
                    {n.actor}
                  </Link>{' '}
                  {VERBS[n.type] || 'interacted with you'}
                  {n.snippetId && n.snippetTitle && (
                    <>
                      {' '}
                      <Link to={`/snippets/${n.snippetId}`}>“{n.snippetTitle}”</Link>
                    </>
                  )}
                </span>
                <span className="muted small">{timeAgo(n.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
