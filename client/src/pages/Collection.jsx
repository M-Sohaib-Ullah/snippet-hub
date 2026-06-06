import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SnippetGrid from '../components/SnippetGrid.jsx';

export default function Collection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collection, setCollection] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');

  const labelFor = useCallback(
    (key) => languages.find((l) => l.key === key)?.label || key,
    [languages]
  );

  useEffect(() => {
    api.languages().then(setLanguages).catch(() => {});
    api.getCollection(id).then(setCollection).catch((e) => setError(e.message));
  }, [id]);

  async function remove() {
    if (!window.confirm('Delete this collection? The snippets themselves are not deleted.')) return;
    try {
      await api.deleteCollection(id);
      navigate(`/u/${user.username}`);
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!collection) return <p className="muted">Loading…</p>;

  const isOwner = user && user.id === collection.ownerId;

  return (
    <div>
      <section className="hero">
        <div className="detail-head">
          <div>
            <h1>{collection.name}</h1>
            <p className="muted">
              {collection.itemCount} snippet{collection.itemCount === 1 ? '' : 's'} · by{' '}
              <Link to={`/u/${collection.owner}`}>{collection.owner}</Link>
            </p>
            {collection.description && <p>{collection.description}</p>}
          </div>
          {isOwner && (
            <button className="btn btn-danger" onClick={remove}>
              Delete collection
            </button>
          )}
        </div>
      </section>

      <SnippetGrid
        data={{ snippets: collection.snippets, total: collection.snippets.length, page: 1, pages: 1 }}
        loading={false}
        error=""
        labelFor={labelFor}
        emptyMessage="This collection is empty."
      />
    </div>
  );
}
