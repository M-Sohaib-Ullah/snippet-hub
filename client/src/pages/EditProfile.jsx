import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Pull the current bio (not stored in the auth user object).
  useEffect(() => {
    if (user) api.getUser(user.username).then((p) => setBio(p.bio || '')).catch(() => {});
  }, [user]);

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await api.uploadAvatar(file);
      setAvatar(res.avatar);
      updateUser({ avatar: res.avatar });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.updateProfile({ bio });
      updateUser({ avatar: res.avatar });
      navigate(`/u/${user.username}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="narrow">
      <h1>Edit profile</h1>
      <form className="card form" onSubmit={save}>
        {error && <div className="alert">{error}</div>}

        <div className="avatar-edit">
          <Avatar username={user.username} avatar={avatar} size={80} />
          <div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Change avatar'}
            </button>
            <p className="muted small">PNG, JPG, GIF or WEBP, up to 2 MB.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              hidden
              onChange={onPickFile}
            />
          </div>
        </div>

        <label>
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Tell people what you build…"
          />
        </label>

        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
