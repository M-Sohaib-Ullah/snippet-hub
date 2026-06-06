import SnippetCard from './SnippetCard.jsx';

// Renders a paginated grid of snippets shared by Home, Feed and profile pages.
export default function SnippetGrid({ data, loading, error, labelFor, onPage, emptyMessage }) {
  if (loading) return <p className="muted">Loading snippets…</p>;
  if (error) return <div className="alert">{error}</div>;
  if (!data || data.snippets.length === 0) {
    return (
      <div className="empty">
        <p>{emptyMessage || 'No snippets found.'}</p>
      </div>
    );
  }

  return (
    <>
      <p className="muted small">
        {data.total} snippet{data.total === 1 ? '' : 's'}
      </p>
      <div className="grid">
        {data.snippets.map((s) => (
          <SnippetCard key={s.id} snippet={s} languageLabel={labelFor(s.language)} />
        ))}
      </div>
      {data.pages > 1 && onPage && (
        <div className="pagination">
          <button
            className="btn btn-ghost"
            disabled={data.page <= 1}
            onClick={() => onPage(data.page - 1)}
          >
            ← Prev
          </button>
          <span className="muted">
            Page {data.page} of {data.pages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={data.page >= data.pages}
            onClick={() => onPage(data.page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}
