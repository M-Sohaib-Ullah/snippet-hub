import { Link } from 'react-router-dom';
import { timeAgo } from '../time.js';

// A larger spotlight treatment for the top snippet in the default browse view.
// Gives the grid real hierarchy (and shows more code) instead of a flat run of
// identical cards.
export default function FeaturedSnippet({ snippet, languageLabel }) {
  const preview = snippet.code.split('\n').slice(0, 16).join('\n');

  return (
    <Link to={`/snippets/${snippet.id}`} className="card featured">
      <div className="featured-main">
        <div className="featured-top">
          <span className="lang-badge">{languageLabel || snippet.language}</span>
          <span className="muted small">Latest · {timeAgo(snippet.createdAt)}</span>
        </div>
        <h2 className="featured-title">{snippet.title}</h2>
        {snippet.description && <p className="featured-desc">{snippet.description}</p>}
        {snippet.tags.length > 0 && (
          <div className="tag-row">
            {snippet.tags.slice(0, 5).map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="featured-foot">
          <span className="muted small">by {snippet.author}</span>
          <span className="stat-row muted small">
            <span title="likes">♥ {snippet.likeCount}</span>
            <span title="comments">💬 {snippet.commentCount}</span>
            <span title="downloads">⬇ {snippet.downloads}</span>
          </span>
        </div>
      </div>
      <div className="featured-code">
        <pre>
          <code>{preview}</code>
        </pre>
        <span className="featured-fade" aria-hidden="true" />
      </div>
    </Link>
  );
}
