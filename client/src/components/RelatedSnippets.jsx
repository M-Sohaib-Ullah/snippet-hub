import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

// Shows other snippets in the same language (excluding the current one).
export default function RelatedSnippets({ snippet, labelFor }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    api
      .listSnippets(`?language=${snippet.language}&limit=7`)
      .then((d) => {
        if (!active) return;
        setItems(d.snippets.filter((s) => s.id !== snippet.id).slice(0, 6));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [snippet.id, snippet.language]);

  if (items.length === 0) return null;

  return (
    <section className="related">
      <h2>More in {labelFor(snippet.language)}</h2>
      <div className="related-list">
        {items.map((s) => (
          <Link key={s.id} to={`/snippets/${s.id}`} className="related-item">
            <span className="related-title">{s.title}</span>
            <span className="muted small">
              by {s.author} · ♥ {s.likeCount}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
