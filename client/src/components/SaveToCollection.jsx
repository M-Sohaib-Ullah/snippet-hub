import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

// A "Save" button + popover for adding/removing a snippet to/from collections.
export default function SaveToCollection({ snippetId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const boxRef = useRef(null);

  const savedCount = collections.filter((c) => c.included).length;

  function load() {
    api
      .myCollections(snippetId)
      .then(setCollections)
      .catch((e) => setError(e.message));
  }

  // Close the popover when clicking outside it.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function toggleOpen() {
    if (!user) return navigate('/login');
    if (!open) load();
    setOpen((o) => !o);
  }

  async function toggleMembership(col) {
    setError('');
    try {
      if (col.included) await api.removeFromCollection(col.id, snippetId);
      else await api.addToCollection(col.id, snippetId);
      setCollections((cs) =>
        cs.map((c) =>
          c.id === col.id
            ? { ...c, included: !c.included, itemCount: c.itemCount + (c.included ? -1 : 1) }
            : c
        )
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function createAndAdd(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError('');
    try {
      const created = await api.createCollection({ name });
      await api.addToCollection(created.id, snippetId);
      setNewName('');
      setCollections((cs) => [{ ...created, included: true, itemCount: 1 }, ...cs]);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="save-wrap" ref={boxRef}>
      <button className={`btn btn-ghost ${savedCount > 0 ? 'saved' : ''}`} onClick={toggleOpen}>
        {savedCount > 0 ? '★ Saved' : '☆ Save'}
      </button>
      {open && (
        <div className="save-pop">
          <p className="save-title">Save to collection</p>
          {error && <div className="alert">{error}</div>}
          {collections.length === 0 ? (
            <p className="muted small">No collections yet — create one below.</p>
          ) : (
            <ul className="save-list">
              {collections.map((c) => (
                <li key={c.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={c.included}
                      onChange={() => toggleMembership(c)}
                    />
                    <span>{c.name}</span>
                    <span className="muted small">{c.itemCount}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <form className="save-new" onSubmit={createAndAdd}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection…"
              maxLength={80}
            />
            <button className="btn btn-primary" disabled={!newName.trim()}>
              Create
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
