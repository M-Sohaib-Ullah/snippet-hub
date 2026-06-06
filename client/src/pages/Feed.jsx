import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import SnippetGrid from '../components/SnippetGrid.jsx';

export default function Feed() {
  const [data, setData] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const labelFor = useCallback(
    (key) => languages.find((l) => l.key === key)?.label || key,
    [languages]
  );

  useEffect(() => {
    api.languages().then(setLanguages).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .feed(`?page=${page}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <section className="hero">
        <h1>Your feed</h1>
        <p className="muted">The latest snippets from people you follow.</p>
      </section>

      {!loading && data && data.snippets.length === 0 && !error ? (
        <div className="empty">
          <p>Your feed is empty.</p>
          <p className="muted">
            Follow some people to see their snippets here — start by{' '}
            <Link to="/">browsing</Link> and visiting an author's profile.
          </p>
        </div>
      ) : (
        <SnippetGrid
          data={data}
          loading={loading}
          error={error}
          labelFor={labelFor}
          onPage={setPage}
        />
      )}
    </div>
  );
}
