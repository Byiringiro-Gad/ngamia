import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Shared axios instance.
// GETs: 8s timeout (keepAlive ping keeps Neon warm so cold-starts are rare).
// Writes: 12s (transactions can take longer).
const api = axios.create({
  baseURL: API_URL,
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  if (config.method === 'get' && !config._timeoutOverride) {
    config.timeout = 8000;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      err.response = err.response || {};
      err.response.data = { error: 'Connection is slow. Please try again.' };
    }
    return Promise.reject(err);
  }
);

export { API_URL };
export default api;
