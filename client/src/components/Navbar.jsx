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

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">{'</>'}</span> SnippetHub
        </Link>
        <nav className="nav-links">
          {user && (
            <NavLink to="/" end>
              Browse
            </NavLink>
          )}
          {user && <NavLink to="/explore">Explore</NavLink>}
          {user && <NavLink to="/feed">Feed</NavLink>}
          {user && (
            <NavLink to="/notifications" className="bell" title="Notifications">
              🔔
              {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
            </NavLink>
          )}
          <button
            className="btn btn-ghost icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          {user ? (
            <>
              <NavLink to="/new">+ New Snippet</NavLink>
              <NavLink to={`/u/${user.username}`} className="nav-user">
                <Avatar username={user.username} avatar={user.avatar} size={26} />
                <span>{user.username}</span>
              </NavLink>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
