import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="narrow">
      <h1>Create your account</h1>
      <form className="card form" onSubmit={handleSubmit}>
        {error && <div className="alert">{error}</div>}
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            required
          />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password <span className="muted small">(min 6 characters)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Creating…' : 'Sign up'}
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
