import { useState } from 'react';

// Reusable create/edit form. `languages` is the list from the API.
export default function SnippetForm({ languages, initial = {}, onSubmit, submitLabel }) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [language, setLanguage] = useState(initial.language || 'javascript');
  const [code, setCode] = useState(initial.code || '');
  const [tags, setTags] = useState((initial.tags || []).join(', '));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit({ title, description, language, code, tags });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      {error && <div className="alert">{error}</div>}

      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Debounce function"
          maxLength={120}
          required
        />
      </label>

      <label>
        Description <span className="muted small">(optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this snippet do?"
          rows={2}
        />
      </label>

      <div className="form-row">
        <label className="grow">
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languages.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grow">
          Tags <span className="muted small">(comma separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="utility, async, react"
          />
        </label>
      </div>

      <label>
        Code
        <textarea
          className="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here…"
          rows={14}
          spellCheck={false}
          required
        />
      </label>

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
