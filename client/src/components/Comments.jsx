import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { timeAgo } from '../time.js';

export default function Comments({ snippetId, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listComments(snippetId).then(setComments).catch(() => {});
  }, [snippetId]);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    try {
      const created = await api.addComment(snippetId, body.trim());
      setComments((c) => [...c, created]);
      setBody('');
      onCountChange?.(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      await api.deleteComment(snippetId, id);
      setComments((c) => c.filter((x) => x.id !== id));
      onCountChange?.(-1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="comments">
      <h2>
        Comments <span className="muted">({comments.length})</span>
      </h2>

      {user ? (
        <form className="comment-form" onSubmit={submit}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            maxLength={1000}
          />
          <button className="btn btn-primary" disabled={busy || !body.trim()}>
            {busy ? 'Posting…' : 'Post'}
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link to="/login">Log in</Link> to join the conversation.
        </p>
      )}

      {error && <div className="alert">{error}</div>}

      {comments.length === 0 ? (
        <p className="muted">No comments yet. Be the first!</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <div className="comment-head">
                <Link to={`/u/${c.author}`} className="comment-author">
                  {c.author}
                </Link>
                <span className="muted small">{timeAgo(c.createdAt)}</span>
                {user && user.id === c.authorId && (
                  <button className="link-btn" onClick={() => remove(c.id)}>
                    delete
                  </button>
                )}
              </div>
              <p className="comment-body">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
