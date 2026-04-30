import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Shared axios instance with sensible timeouts.
// Read operations (GET) use a 5s timeout.
// Write operations (POST/PUT/DELETE) use 10s to allow for DB transactions.
// Both are well within the "no more than a few seconds" UX target.
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // default: 10s for writes
});

// Override timeout for GET requests to 12s (Neon serverless DB can take 3-5s to wake)
api.interceptors.request.use((config) => {
  if (config.method === 'get' && !config._timeoutOverride) {
    config.timeout = 12000;
  }
  return config;
});

// On timeout, surface a friendly message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      err.response = err.response || {};
      err.response.data = { error: 'Request timed out. Please check your connection and try again.' };
    }
    return Promise.reject(err);
  }
);

export { API_URL };
export default api;
