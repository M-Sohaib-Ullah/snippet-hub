import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import SnippetGrid from '../components/SnippetGrid.jsx';

const TABS = [
  { key: 'trending', label: '🔥 Trending' },
  { key: 'likes', label: '♥ Most liked' },
  { key: 'downloads', label: '⬇ Most downloaded' },
  { key: 'newest', label: '🕑 Newest' },
];

export default function Explore() {
  const [sort, setSort] = useState('trending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      .listSnippets(`?sort=${sort}&page=${page}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sort, page]);

  return (
    <div>
      <section className="hero">
        <h1>Explore</h1>
        <p className="muted">
          What the community is using right now. Also browse by{' '}
          <Link to="/tags">tags</Link>.
        </p>
      </section>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${sort === t.key ? 'active' : ''}`}
            onClick={() => {
              setSort(t.key);
              setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SnippetGrid
        data={data}
        loading={loading}
        error={error}
        labelFor={labelFor}
        onPage={setPage}
      />
    </div>
  );
}
