import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SnippetGrid from '../components/SnippetGrid.jsx';
import Avatar from '../components/Avatar.jsx';

export default function UserProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [collections, setCollections] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [followBusy, setFollowBusy] = useState(false);

  const labelFor = useCallback(
    (key) => languages.find((l) => l.key === key)?.label || key,
    [languages]
  );

  useEffect(() => {
    api.languages().then(setLanguages).catch(() => {});
  }, []);

  // Load profile + collections when the username changes.
  useEffect(() => {
    setProfile(null);
    setError('');
    setPage(1);
    api.getUser(username).then(setProfile).catch((e) => setError(e.message));
    api.userCollections(username).then(setCollections).catch(() => setCollections([]));
  }, [username]);

  // Load this user's snippets.
  useEffect(() => {
    setLoading(true);
    api
      .listSnippets(`?author=${encodeURIComponent(username)}&page=${page}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username, page]);

  async function toggleFollow() {
    setFollowBusy(true);
    try {
      const res = profile.isFollowing
        ? await api.unfollowUser(username)
        : await api.followUser(username);
      setProfile((p) => ({ ...p, isFollowing: res.isFollowing, followerCount: res.followerCount }));
    } catch (e) {
      setError(e.message);
    } finally {
      setFollowBusy(false);
    }
  }

  if (error && !profile) return <div className="alert">{error}</div>;
  if (!profile) return <p className="muted">Loading…</p>;

  return (
    <div>
      <section className="profile-head">
        <Avatar username={profile.username} avatar={profile.avatar} size={80} />
        <div className="profile-info">
          <div className="profile-title">
            <h1>{profile.username}</h1>
            {profile.isMe ? (
              <Link to="/settings/profile" className="btn btn-ghost">
                Edit profile
              </Link>
            ) : (
              user && (
                <button
                  className={`btn ${profile.isFollowing ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={toggleFollow}
                  disabled={followBusy}
                >
                  {profile.isFollowing ? 'Following ✓' : 'Follow'}
                </button>
              )
            )}
          </div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="stats">
            <div className="stat">
              <strong>{profile.snippetCount}</strong>
              <span className="muted small">snippets</span>
            </div>
            <Link to={`/u/${profile.username}/followers`} className="stat stat-link">
              <strong>{profile.followerCount}</strong>
              <span className="muted small">followers</span>
            </Link>
            <Link to={`/u/${profile.username}/following`} className="stat stat-link">
              <strong>{profile.followingCount}</strong>
              <span className="muted small">following</span>
            </Link>
          </div>
        </div>
      </section>

      {collections.length > 0 && (
        <section className="collections-section">
          <h2>Collections</h2>
          <div className="collection-row">
            {collections.map((c) => (
              <Link key={c.id} to={`/collections/${c.id}`} className="card collection-chip">
                <strong>{c.name}</strong>
                <span className="muted small">
                  {c.itemCount} snippet{c.itemCount === 1 ? '' : 's'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <h2>{profile.isMe ? 'Your snippets' : `${profile.username}'s snippets`}</h2>
      <SnippetGrid
        data={data}
        loading={loading}
        error={error}
        labelFor={labelFor}
        onPage={setPage}
        emptyMessage={
          profile.isMe
            ? "You haven't uploaded any snippets yet."
            : `${profile.username} hasn't uploaded any snippets yet.`
        }
      />
    </div>
  );
}
