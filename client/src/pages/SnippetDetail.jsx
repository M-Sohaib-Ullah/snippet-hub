import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import CodeView from '../components/CodeView.jsx';
import Comments from '../components/Comments.jsx';
import SaveToCollection from '../components/SaveToCollection.jsx';
import RunPanel from '../components/RunPanel.jsx';
import RelatedSnippets from '../components/RelatedSnippets.jsx';
import { SnippetDetailSkeleton } from '../components/Skeleton.jsx';

export default function SnippetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [snippet, setSnippet] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    setSnippet(null);
    setError('');
    api.getSnippet(id).then(setSnippet).catch((e) => setError(e.message));
    api.languages().then(setLanguages).catch(() => {});
  }, [id]);

  const labelFor = (key) => languages.find((l) => l.key === key)?.label || key;

  async function toggleLike() {
    if (!user) return navigate('/login');
    try {
      const res = snippet.likedByMe
        ? await api.unlikeSnippet(snippet.id)
        : await api.likeSnippet(snippet.id);
      setSnippet((s) => ({ ...s, likedByMe: res.likedByMe, likeCount: res.likeCount }));
      if (res.likedByMe) {
        // Pop only when a like lands, not on un-like.
        setLiking(true);
        setTimeout(() => setLiking(false), 340);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function fork() {
    if (!user) return navigate('/login');
    setBusy(true);
    try {
      const created = await api.forkSnippet(snippet.id);
      navigate(`/snippets/${created.id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function download() {
    // Authenticated fetch (the download endpoint now requires login), then save
    // the returned bytes as a file via a temporary object URL.
    try {
      const { blob, filename } = await api.downloadSnippet(snippet.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSnippet((s) => ({ ...s, downloads: s.downloads + 1 }));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this snippet? This cannot be undone.')) return;
    try {
      await api.deleteSnippet(snippet.id);
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!snippet) return <SnippetDetailSkeleton />;

  const isOwner = user && user.id === snippet.authorId;

  return (
    <article className="detail">
      <Link to="/" className="back-link">
        ← Back to browse
      </Link>

      <div className="detail-head">
        <div>
          <h1>{snippet.title}</h1>
          <p className="muted">
            <span className="lang-badge">{labelFor(snippet.language)}</span> · by{' '}
            <Link to={`/u/${snippet.author}`}>{snippet.author}</Link> · ⬇ {snippet.downloads}
          </p>
          {snippet.forkedFrom && (
            <p className="muted small">
              ⑂ forked from{' '}
              <Link to={`/snippets/${snippet.forkedFrom.id}`}>{snippet.forkedFrom.title}</Link> by{' '}
              {snippet.forkedFrom.author}
            </p>
          )}
        </div>
        {isOwner && (
          <div className="detail-actions">
            <Link to={`/snippets/${snippet.id}/edit`} className="btn btn-ghost">
              Edit
            </Link>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>

      {snippet.description && (
        <div className="detail-desc markdown">
          <ReactMarkdown>{snippet.description}</ReactMarkdown>
        </div>
      )}

      {snippet.tags.length > 0 && (
        <div className="tag-row">
          {snippet.tags.map((t) => (
            <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="tag">
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="code-toolbar">
        <button
          className={`btn btn-ghost ${snippet.likedByMe ? 'liked' : ''} ${liking ? 'pop' : ''}`}
          onClick={toggleLike}
        >
          {snippet.likedByMe ? '♥' : '♡'} {snippet.likeCount}
        </button>
        <button className="btn btn-ghost" onClick={fork} disabled={busy || isOwner} title={isOwner ? "You can't fork your own snippet" : 'Fork into your account'}>
          ⑂ Fork {snippet.forkCount > 0 ? snippet.forkCount : ''}
        </button>
        <SaveToCollection snippetId={snippet.id} />
        <RunPanel code={snippet.code} language={snippet.language} />
        <button className="btn btn-primary" onClick={download}>
          ⬇ Download
        </button>
      </div>

      <CodeView code={snippet.code} language={snippet.language} languageLabel={labelFor(snippet.language)} />

      <RelatedSnippets snippet={snippet} labelFor={labelFor} />

      <Comments
        snippetId={snippet.id}
        onCountChange={(delta) =>
          setSnippet((s) => ({ ...s, commentCount: s.commentCount + delta }))
        }
      />
    </article>
  );
}
