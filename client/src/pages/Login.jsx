import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(identifier, password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="narrow">
      <h1>Welcome back</h1>
      <form className="card form" onSubmit={handleSubmit}>
        {error && <div className="alert">{error}</div>}
        <label>
          Username or email
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="muted">
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}
