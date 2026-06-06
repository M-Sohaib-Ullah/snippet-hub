import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import SnippetForm from '../components/SnippetForm.jsx';

export default function EditSnippet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [snippet, setSnippet] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.languages().then(setLanguages).catch(() => {});
    api.getSnippet(id).then(setSnippet).catch((e) => setError(e.message));
  }, [id]);

  async function handleSubmit(values) {
    await api.updateSnippet(id, values);
    navigate(`/snippets/${id}`);
  }

  if (error) return <div className="alert">{error}</div>;
  if (!snippet || languages.length === 0) return <p className="muted">Loading…</p>;

  return (
    <div className="narrow-wide">
      <h1>Edit snippet</h1>
      <SnippetForm
        languages={languages}
        initial={snippet}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
