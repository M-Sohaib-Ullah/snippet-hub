import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Feed from './pages/Feed.jsx';
import Explore from './pages/Explore.jsx';
import Tags from './pages/Tags.jsx';
import SnippetDetail from './pages/SnippetDetail.jsx';
import NewSnippet from './pages/NewSnippet.jsx';
import EditSnippet from './pages/EditSnippet.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import UserProfile from './pages/UserProfile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import FollowList from './pages/FollowList.jsx';
import Notifications from './pages/Notifications.jsx';
import Collection from './pages/Collection.jsx';
import { useAuth } from './context/AuthContext.jsx';

// Redirects /profile to the signed-in user's public profile.
function ProfileRedirect() {
  const { user } = useAuth();
  return <Navigate to={`/u/${user.username}`} replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Navbar />
      <main className="container">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !user ? (
          // Login-gated: guests can only reach login/register; everything else
          // redirects to the login page.
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/collections/:id" element={<Collection />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings/profile" element={<EditProfile />} />
            <Route path="/snippets/:id" element={<SnippetDetail />} />
            <Route path="/new" element={<NewSnippet />} />
            <Route path="/snippets/:id/edit" element={<EditSnippet />} />
            <Route path="/u/:username" element={<UserProfile />} />
            <Route path="/u/:username/followers" element={<FollowList mode="followers" />} />
            <Route path="/u/:username/following" element={<FollowList mode="following" />} />
            <Route path="/profile" element={<ProfileRedirect />} />
            {/* Already signed in: keep these from showing the auth forms. */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <footer className="footer">
        <span>SnippetHub — share & discover code snippets</span>
      </footer>
    </>
  );
}
