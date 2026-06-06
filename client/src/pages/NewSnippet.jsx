import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import SnippetForm from '../components/SnippetForm.jsx';

export default function NewSnippet() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    api.languages().then(setLanguages).catch(() => {});
  }, []);

  async function handleSubmit(values) {
    const created = await api.createSnippet(values);
    navigate(`/snippets/${created.id}`);
  }

  return (
    <div className="narrow-wide">
      <h1>Upload a snippet</h1>
      {languages.length > 0 && (
        <SnippetForm languages={languages} onSubmit={handleSubmit} submitLabel="Publish snippet" />
      )}
    </div>
  );
}
