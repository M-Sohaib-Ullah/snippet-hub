import { Link, useNavigate } from 'react-router-dom';
import { timeAgo } from '../time.js';

export default function SnippetCard({ snippet, languageLabel }) {
  const navigate = useNavigate();
  const preview = snippet.code.split('\n').slice(0, 6).join('\n');

  // The card is a link; the inner author link navigates separately.
  function goToAuthor(e) {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/u/${snippet.author}`);
  }

  return (
    <Link to={`/snippets/${snippet.id}`} className="card snippet-card">
      <div className="snippet-card-head">
        <span className="lang-badge">{languageLabel || snippet.language}</span>
        <span className="muted small">{timeAgo(snippet.createdAt)}</span>
      </div>
      <h3 className="snippet-card-title">{snippet.title}</h3>
      {snippet.forkedFrom && (
        <span className="muted small fork-note">⑂ forked from {snippet.forkedFrom.author}</span>
      )}
      {snippet.description && <p className="snippet-card-desc">{snippet.description}</p>}
      <pre className="snippet-card-code">
        <code>{preview}</code>
      </pre>
      <div className="snippet-card-foot">
        <span className="muted small author-link" onClick={goToAuthor}>
          by {snippet.author}
        </span>
        <span className="stat-row muted small">
          <span title="likes">♥ {snippet.likeCount}</span>
          <span title="comments">💬 {snippet.commentCount}</span>
          <span title="downloads">⬇ {snippet.downloads}</span>
        </span>
      </div>
      {snippet.tags.length > 0 && (
        <div className="tag-row">
          {snippet.tags.slice(0, 4).map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
