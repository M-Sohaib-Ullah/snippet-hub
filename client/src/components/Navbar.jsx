import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../api.js';
import Avatar from './Avatar.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  // Poll the unread notification count while signed in. Re-checks on every
  // route change too, so the badge updates promptly after you act.
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let active = true;
    const check = () =>
      api
        .unreadCount()
        .then((d) => active && setUnread(d.unread))
        .catch(() => {});
    check();
    const timer = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user, location.pathname]);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const close = () => setOpen(false);

  function handleLogout() {
    close();
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">{'</>'}</span> SnippetHub
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? '✕' : '☰'}
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {user && (
            <NavLink to="/" end onClick={close}>
              Browse
            </NavLink>
          )}
          {user && (
            <NavLink to="/explore" onClick={close}>
              Explore
            </NavLink>
          )}
          {user && (
            <NavLink to="/feed" onClick={close}>
              Feed
            </NavLink>
          )}
          {user && (
            <NavLink to="/notifications" className="bell" title="Notifications" onClick={close}>
              🔔<span className="bell-label">Notifications</span>
              {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
            </NavLink>
          )}
          <button
            className="btn btn-ghost icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          {user ? (
            <>
              <NavLink to="/new" onClick={close}>
                + New Snippet
              </NavLink>
              <NavLink to={`/u/${user.username}`} className="nav-user" onClick={close}>
                <Avatar username={user.username} avatar={user.avatar} size={26} />
                <span>{user.username}</span>
              </NavLink>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>
                Log in
              </NavLink>
              <NavLink to="/register" className="btn btn-primary" onClick={close}>
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
