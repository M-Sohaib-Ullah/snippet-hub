import { avatarUrl } from '../api.js';

// Deterministic background colour from a username, used for the initials fallback.
const COLORS = ['#6d8bff', '#ff6b6b', '#3bc9a8', '#f7a85b', '#b07bff', '#3aa0ff', '#ff7eb6'];
function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export default function Avatar({ username = '?', avatar, size = 40 }) {
  const url = avatarUrl(avatar);
  const style = { width: size, height: size, fontSize: size * 0.42 };

  if (url) {
    return <img className="avatar-img" src={url} alt={username} style={style} />;
  }
  return (
    <span className="avatar-initial" style={{ ...style, background: colorFor(username) }}>
      {username.charAt(0).toUpperCase()}
    </span>
  );
}
