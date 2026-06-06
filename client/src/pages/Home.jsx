import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import SnippetCard from '../components/SnippetCard.jsx';
import { SnippetGridSkeleton } from '../components/Skeleton.jsx';

export default function Home() {
  const [languages, setLanguages] = useState([]);
  const [data, setData] = useState({ snippets: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const language = searchParams.get('language') || '';
  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const [searchInput, setSearchInput] = useState(q);

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
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (language) params.set('language', language);
    if (tag) params.set('tag', tag);
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    api
      .listSnippets(`?${params.toString()}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q, language, tag, sort, page]);

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!('page' in changes)) next.set('page', '1');
    setSearchParams(next);
  }

  function onSearchSubmit(e) {
    e.preventDefault();
    updateParams({ q: searchInput });
  }

  return (
    <div>
      <section className="hero">
        <h1>Discover & share code snippets</h1>
        <p className="muted">
          A community library of reusable code. Search, copy, download — or upload your own.
        </p>
      </section>

      <div className="toolbar">
        <form className="search" onSubmit={onSearchSubmit}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search snippets, code, tags…"
          />
          <button className="btn btn-primary">Search</button>
        </form>

        <div className="filters">
          <select value={language} onChange={(e) => updateParams({ language: e.target.value })}>
            <option value="">All languages</option>
            {languages.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="downloads">Most downloaded</option>
            <option value="likes">Most liked</option>
          </select>
        </div>
      </div>

      {(q || language || tag) && (
        <div className="active-filters">
          {q && <Chip label={`search: ${q}`} onClear={() => { setSearchInput(''); updateParams({ q: '' }); }} />}
          {language && <Chip label={`lang: ${labelFor(language)}`} onClear={() => updateParams({ language: '' })} />}
          {tag && <Chip label={`#${tag}`} onClear={() => updateParams({ tag: '' })} />}
        </div>
      )}

      {loading ? (
        <SnippetGridSkeleton />
      ) : error ? (
        <div className="alert">{error}</div>
      ) : data.snippets.length === 0 ? (
        <div className="empty">
          <p>No snippets found.</p>
          <p className="muted">Try a different search or be the first to upload one!</p>
        </div>
      ) : (
        <>
          <p className="muted small">{data.total} snippet{data.total === 1 ? '' : 's'}</p>
          <div className="grid">
            {data.snippets.map((s) => (
              <SnippetCard key={s.id} snippet={s} languageLabel={labelFor(s.language)} />
            ))}
          </div>
          {data.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-ghost"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                ← Prev
              </button>
              <span className="muted">
                Page {data.page} of {data.pages}
              </span>
              <button
                className="btn btn-ghost"
                disabled={page >= data.pages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ label, onClear }) {
  return (
    <span className="chip">
      {label}
      <button onClick={onClear} aria-label="Clear filter">
        ×
      </button>
    </span>
  );
}
