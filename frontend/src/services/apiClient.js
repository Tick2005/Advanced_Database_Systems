const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };
const mergeHeaders = (headers = {}, withAuth = true) => {
  const token = localStorage.getItem('authToken');
  const authHeaders = withAuth && token ? { Authorization: `Bearer ${token}` } : {};
  return { ...DEFAULT_HEADERS, ...authHeaders, ...headers };
};
const handleResponse = async (response) => {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const message = isJson ? payload?.message || payload?.error || 'Request failed' : payload;
    throw new Error(message);
  }
  if (isJson && payload && Object.prototype.hasOwnProperty.call(payload, 'success')) {
    if (!payload.success) throw new Error(payload?.message || 'Request failed');
    return payload.data;
  }
  return payload;
};
const request = async (url, options = {}) => {
  const { headers, withAuth = true, ...rest } = options;
  const response = await fetch(url, { ...rest, headers: mergeHeaders(headers, withAuth) });
  return handleResponse(response);
};
const apiClient = {
  request,
  get: (url, opts = {}) => request(url, { ...opts, method: 'GET' }),
  post: (url, body, opts = {}) => request(url, { ...opts, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: (url, body, opts = {}) => request(url, { ...opts, method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (url, body, opts = {}) => request(url, { ...opts, method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (url, opts = {}) => request(url, { ...opts, method: 'DELETE' }),
};
export default apiClient;
