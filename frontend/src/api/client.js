const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'pipeline-token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

async function request(path, { method = 'GET', body, params } = {}) {
  const token = tokenStore.get();
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}${toQuery(params)}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Can’t reach the server. Check that the API is running and try again.', 0);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    // A rejected token means the session is over; a failed sign-in has no token yet.
    if (response.status === 401 && token) {
      tokenStore.clear();
      onUnauthorized();
    }
    throw new ApiError(data?.message || 'Something went wrong. Try again.', response.status, data?.details);
  }

  return data;
}

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body }),
    login: (body) => request('/auth/login', { method: 'POST', body }),
    me: () => request('/auth/me'),
  },
  applications: {
    list: (params) => request('/applications', { params }),
    stats: () => request('/applications/stats'),
    get: (id) => request(`/applications/${id}`),
    create: (body) => request('/applications', { method: 'POST', body }),
    update: (id, body) => request(`/applications/${id}`, { method: 'PUT', body }),
    changeStatus: (id, body) => request(`/applications/${id}/status`, { method: 'PATCH', body }),
    remove: (id) => request(`/applications/${id}`, { method: 'DELETE' }),
  },
};
