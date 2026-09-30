// Dynamic API URL Helper for local vs Vercel / external deployments

export const getApiBaseUrl = () => {
  // If running locally on localhost/127.0.0.1, use relative path or localhost:8000
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ''; // Relative path handled by FastAPI static mount
    }
  }
  // Default local backend URL for external frontend hosts (e.g. Vercel)
  return 'http://127.0.0.1:8000';
};

export const buildApiUrl = (path) => {
  const base = getApiBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};
