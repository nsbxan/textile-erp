const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const token = localStorage.getItem('erp_token');
  const userId = localStorage.getItem('erp_user_id');

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(userId ? { 'x-user-id': userId } : {}),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Xatolik: ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API so'rovida xatolik [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  get: (endpoint) => fetchApi(endpoint, { method: 'GET' }),
  post: (endpoint, body) => fetchApi(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => fetchApi(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => fetchApi(endpoint, { method: 'DELETE' }),
};
