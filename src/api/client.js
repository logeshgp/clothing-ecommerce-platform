/**
 * Thin API client.
 *
 * Every request carries the session cookie (`credentials: 'include'`) and, for
 * state-changing verbs, echoes the CSRF token the server set in a readable
 * cookie. Errors are normalised into a single `ApiError` shape so callers can
 * surface `error.message` and `error.fields` directly in forms.
 */

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ??
  (import.meta.env.DEV ? 'http://localhost:4000' : '');

export class ApiError extends Error {
  constructor(message, { status, fields } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields ?? null;
  }
}

function readCookie(name) {
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function request(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const options = {
    method,
    credentials: 'include',
    headers: { ...headers },
  };

  if (!['GET', 'HEAD'].includes(method)) {
    const csrf = readCookie('dnd_csrf');
    if (csrf) options.headers['X-CSRF-Token'] = decodeURIComponent(csrf);
  }

  if (body !== undefined) {
    if (raw) {
      options.body = body;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', { status: 0 });
  }

  const text = await response.text();
  const data = text ? safeParse(text) : {};

  if (!response.ok) {
    throw new ApiError(data.error ?? `Request failed (${response.status}).`, {
      status: response.status,
      fields: data.fields,
    });
  }

  return data;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body, options) => request(path, { method: 'POST', body, ...options }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),

  /* ------------------------------------------------------------ storefront */
  storefront: () => request('/api/storefront'),
  product: (slug) => request(`/api/products/${encodeURIComponent(slug)}`),

  /* ------------------------------------------------------------------ auth */
  session: () => request('/api/auth/session'),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  requestCode: (email) => request('/api/auth/code/request', { method: 'POST', body: { email } }),
  verifyCode: (payload) => request('/api/auth/code/verify', { method: 'POST', body: payload }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  changePassword: (payload) => request('/api/auth/password', { method: 'POST', body: payload }),

  /* --------------------------------------------------------------- orders */
  myOrders: () => request('/api/orders'),
  order: (id, email) =>
    request(`/api/orders/${encodeURIComponent(id)}`, {
      headers: email ? { 'X-Order-Email': email } : {},
    }),

  /* --------------------------------------------------------------- support */
  createThread: (payload) => request('/api/support/threads', { method: 'POST', body: payload }),
  thread: (id, email) =>
    request(`/api/support/threads/${encodeURIComponent(id)}`, {
      headers: email ? { 'X-Support-Email': email } : {},
    }),
  replyToThread: (id, payload) =>
    request(`/api/support/threads/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      body: payload,
    }),
  supportQueue: (params = '') => request(`/api/support/queue${params}`),
  updateThread: (id, payload) =>
    request(`/api/support/threads/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),

  /* ----------------------------------------------------------------- admin */
  adminOverview: () => request('/api/admin/overview'),
  saveProduct: (product) => request('/api/admin/products', { method: 'POST', body: product }),
  deleteProduct: (id) => request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  saveCategory: (category) => request('/api/admin/categories', { method: 'POST', body: category }),
  deleteCategory: (slug) =>
    request(`/api/admin/categories/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  updateSettings: (patch) => request('/api/admin/settings', { method: 'PATCH', body: patch }),
  savePromos: (promos) => request('/api/admin/promos', { method: 'PUT', body: { promos } }),
  saveAnnouncements: (announcements) =>
    request('/api/admin/announcements', { method: 'PUT', body: { announcements } }),
  adminOrders: () => request('/api/admin/orders'),
  auditLog: () => request('/api/admin/audit'),
  testWhatsApp: (number) => request('/api/admin/whatsapp/test', { method: 'POST', body: { number } }),

  /** Uploads a File/Blob as raw binary; the server sniffs the real type. */
  uploadImage: (file) =>
    request('/api/admin/uploads', {
      method: 'POST',
      body: file,
      raw: true,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    }),
};

/** Turns a server-relative upload path into an absolute URL. */
export function assetUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (API_BASE) return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  if (url.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${url.replace(/^\/+/, '')}`;
  }
  return url;
}
