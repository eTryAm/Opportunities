const ROOT_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : '';
export const API_BASE = import.meta.env.VITE_API_URL || `${ROOT_BASE}/api/admin`;

const TOKEN_KEY = 'token';
const REMEMBER_KEY = 'admin_remember';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token, remember = false) {
  const store = remember ? localStorage : sessionStorage;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  store.setItem(TOKEN_KEY, token);
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

export function isRemembered() {
  return localStorage.getItem(REMEMBER_KEY) === '1';
}

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch {
    throw new ApiError('Network error. Please check your connection.', 'NETWORK_ERROR');
  }

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    clearToken();
    onUnauthorized?.('Session expired. Please log in again.');
    throw new ApiError('Session expired. Please log in again.', 'UNAUTHORIZED', 401);
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json();
  }

  if (response.status === 429) {
    const message = data?.message || data?.error || 'Too many requests. Please try again later.';
    throw new ApiError(message, 'RATE_LIMIT', 429);
  }

  if (response.status === 423) {
    throw new ApiError('Account locked. Contact an administrator.', 'LOCKED', 423);
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed (${response.status})`;
    throw new ApiError(message, data?.code || 'API_ERROR', response.status, data);
  }

  return data;
}

export class ApiError extends Error {
  constructor(message, code, status, data) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

// Auth
export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
  getSessions: () => request('/auth/sessions'),
  revokeSession: (sessionId) =>
    request(`/auth/sessions/${sessionId}`, { method: 'DELETE' }),
  revokeAllSessions: () => request('/auth/sessions', { method: 'DELETE' }),
  getSecurityInfo: () => request('/auth/security'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => request('/dashboard'),
  getRecentActivity: () => request('/dashboard'),
};

// Form Links
export const formLinksApi = {
  getAll: () => request('/form-links'),
  update: (id, data) => request(`/form-links/${id}`, { method: 'PUT', body: data }),
  updateBulk: (links) => request('/form-links/bulk', { method: 'PUT', body: { links } }),
};

// CRUD resources
const createCrudApi = (resource) => ({
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/${resource}${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/${resource}/${id}`),
  create: (data) => request(`/${resource}`, { method: 'POST', body: data }),
  update: (id, data) => request(`/${resource}/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/${resource}/${id}`, { method: 'DELETE' }),
  togglePublish: (id) => request(`/${resource}/${id}/toggle-publish`, { method: 'PATCH' }),
  toggleFeatured: (id) => request(`/${resource}/${id}/toggle-featured`, { method: 'PATCH' }),
});

export const opportunitiesApi = createCrudApi('opportunities');
export const eventsApi = createCrudApi('events');
export const announcementsApi = createCrudApi('announcements');
export const testimonialsApi = createCrudApi('testimonials');
export const faqsApi = createCrudApi('faqs');
export const applicationsApi = {
  ...createCrudApi('applications'),
  getSources: () => request('/applications/sources/list'),
  syncSheet: (data) => request('/applications/sync-sheet', { method: 'POST', body: data }),
  syncAll: () => request('/applications/sync-all', { method: 'POST' }),
};
export const campusAmbassadorApi = createCrudApi('campus-ambassador');

// Settings
export const settingsApi = {
  getAll: () => request('/settings'),
  getGroup: (group) => request(`/settings/${group}`),
  update: (key, value) =>
    request(`/settings/${key}`, { method: 'PUT', body: { value } }),
  updateGroup: (group, data) =>
    request(`/settings/${group}`, { method: 'PUT', body: data }),
};

// Audit logs
export const auditLogsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs${query ? `?${query}` : ''}`);
  },
};

export default {
  auth: authApi,
  dashboard: dashboardApi,
  formLinks: formLinksApi,
  opportunities: opportunitiesApi,
  events: eventsApi,
  announcements: announcementsApi,
  testimonials: testimonialsApi,
  faqs: faqsApi,
  applications: applicationsApi,
  campusAmbassador: campusAmbassadorApi,
  settings: settingsApi,
  auditLogs: auditLogsApi,
};
