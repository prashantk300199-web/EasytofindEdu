/**
 * Admin Dashboard API Client
 * Thin wrapper around fetch with auth headers
 */

const API_BASE = 'https://api.easytofindedu.com/api/v1';

function getToken() {
  return localStorage.getItem('admin_token');
}

const api = {
  get: async (path, options = {}) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed (${res.status})`);
    }
    return res.json();
  },

  post: async (path, body, options = {}) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed (${res.status})`);
    }
    return res.json();
  },

  put: async (path, body, options = {}) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed (${res.status})`);
    }
    return res.json();
  },
};

export default api;
