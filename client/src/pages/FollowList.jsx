import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import Avatar from '../components/Avatar.jsx';

// Shared page for /u/:username/followers and /u/:username/following.
export default function FollowList({ mode }) {
  const { username } = useParams();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const load = mode === 'followers' ? api.followers(username) : api.following(username);
    load
      .then(setPeople)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username, mode]);

  const heading = mode === 'followers' ? 'Followers' : 'Following';

  return (
    <div className="narrow-wide">
      <Link to={`/u/${username}`} className="back-link">
        ← {username}
      </Link>
      <h1>
        {heading} <span className="muted">({people.length})</span>
      </h1>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <div className="alert">{error}</div>
      ) : people.length === 0 ? (
        <div className="empty">
          <p>
            {mode === 'followers'
              ? `${username} has no followers yet.`
              : `${username} isn't following anyone yet.`}
          </p>
        </div>
      ) : (
        <ul className="people-list">
          {people.map((p) => (
            <li key={p.username}>
              <Link to={`/u/${p.username}`} className="person">
                <Avatar username={p.username} avatar={p.avatar} size={40} />
                <span className="person-name">{p.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
