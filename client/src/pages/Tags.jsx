import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .tags()
      .then(setTags)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Scale tag font size by usage so popular tags read larger (a tag cloud).
  const max = tags.reduce((m, t) => Math.max(m, t.count), 1);
  const sizeFor = (count) => 0.85 + (count / max) * 1.1;

  return (
    <div>
      <section className="hero">
        <h1>Tags</h1>
        <p className="muted">Browse snippets by topic. Bigger tags are more popular.</p>
      </section>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <div className="alert">{error}</div>
      ) : tags.length === 0 ? (
        <div className="empty">
          <p>No tags yet.</p>
        </div>
      ) : (
        <div className="tag-cloud">
          {tags.map((t) => (
            <Link
              key={t.tag}
              to={`/?tag=${encodeURIComponent(t.tag)}`}
              className="cloud-tag"
              style={{ fontSize: `${sizeFor(t.count)}rem` }}
            >
              #{t.tag}
              <span className="cloud-count">{t.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
