// Thin wrapper around fetch that injects the auth token and parses JSON errors.
const TOKEN_KEY = 'snippethub_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Build a usable URL for an uploaded avatar filename (or null for initials).
export function avatarUrl(filename) {
  return filename ? `/api/avatars/${filename}` : null;
}

export const api = {
  // auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),

  // snippets
  languages: () => request('/snippets/languages', { auth: true }),
  tags: () => request('/snippets/tags', { auth: true }),
  listSnippets: (query = '') => request(`/snippets${query}`, { auth: true }),
  feed: (query = '') => request(`/snippets/feed${query}`, { auth: true }),
  getSnippet: (id) => request(`/snippets/${id}`, { auth: true }),
  createSnippet: (payload) => request('/snippets', { method: 'POST', body: payload, auth: true }),
  updateSnippet: (id, payload) =>
    request(`/snippets/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteSnippet: (id) => request(`/snippets/${id}`, { method: 'DELETE', auth: true }),
  forkSnippet: (id) => request(`/snippets/${id}/fork`, { method: 'POST', auth: true }),

  // likes
  likeSnippet: (id) => request(`/snippets/${id}/like`, { method: 'POST', auth: true }),
  unlikeSnippet: (id) => request(`/snippets/${id}/like`, { method: 'DELETE', auth: true }),

  // comments
  listComments: (id) => request(`/snippets/${id}/comments`, { auth: true }),
  addComment: (id, body) =>
    request(`/snippets/${id}/comments`, { method: 'POST', body: { body }, auth: true }),
  deleteComment: (id, commentId) =>
    request(`/snippets/${id}/comments/${commentId}`, { method: 'DELETE', auth: true }),

  // users / social
  getUser: (username) => request(`/users/${encodeURIComponent(username)}`, { auth: true }),
  followUser: (username) =>
    request(`/users/${encodeURIComponent(username)}/follow`, { method: 'POST', auth: true }),
  unfollowUser: (username) =>
    request(`/users/${encodeURIComponent(username)}/follow`, { method: 'DELETE', auth: true }),
  followers: (username) =>
    request(`/users/${encodeURIComponent(username)}/followers`, { auth: true }),
  following: (username) =>
    request(`/users/${encodeURIComponent(username)}/following`, { auth: true }),

  // profile editing
  updateProfile: (payload) => request('/users/me', { method: 'PATCH', body: payload, auth: true }),
  uploadAvatar: async (file) => {
    const form = new FormData();
    form.append('avatar', file);
    const token = getToken();
    const res = await fetch('/api/users/me/avatar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
    return data;
  },

  // notifications
  notifications: () => request('/notifications', { auth: true }),
  unreadCount: () => request('/notifications/unread-count', { auth: true }),
  markNotificationsRead: () => request('/notifications/read', { method: 'POST', auth: true }),

  // collections
  userCollections: (username) =>
    request(`/collections/user/${encodeURIComponent(username)}`, { auth: true }),
  myCollections: (snippetId) =>
    request(`/collections/mine${snippetId ? `?snippetId=${snippetId}` : ''}`, { auth: true }),
  getCollection: (id) => request(`/collections/${id}`, { auth: true }),
  createCollection: (payload) =>
    request('/collections', { method: 'POST', body: payload, auth: true }),
  deleteCollection: (id) => request(`/collections/${id}`, { method: 'DELETE', auth: true }),
  addToCollection: (id, snippetId) =>
    request(`/collections/${id}/items`, { method: 'POST', body: { snippetId }, auth: true }),
  removeFromCollection: (id, snippetId) =>
    request(`/collections/${id}/items/${snippetId}`, { method: 'DELETE', auth: true }),

  // Authenticated download: fetch with the token, then return the file bytes +
  // filename so the caller can trigger a browser save (a plain link can't send
  // the Authorization header).
  downloadSnippet: async (id) => {
    const token = getToken();
    const res = await fetch(`/api/snippets/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Download failed (${res.status})`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    return { blob, filename: match ? match[1] : `snippet-${id}.txt` };
  },
};
