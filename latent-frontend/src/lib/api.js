import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
});

api.interceptors.request.use(cfg => {
  const auth = JSON.parse(localStorage.getItem('latent_auth') || '{}');
  if (auth.state?.token) cfg.headers.Authorization = `Bearer ${auth.state.token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r.data,   // returns { success, data } or { success, error }
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('latent_auth');
      window.location.replace('/login');
    }
    const msg = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

export default api;
