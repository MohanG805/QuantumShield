// API base URL - can be configured via environment variable or auto-detected
// In production, set VITE_API_BASE_URL environment variable
// For development, defaults to current hostname with port 5000
const getApiBase = () => {
  // Check for environment variable (set at build time) - this is REQUIRED for production
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = import.meta.env.VITE_API_BASE_URL.trim();
    // Ensure URL doesn't end with a slash
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  
  // Auto-detect: use current hostname (works for network access)
  // Only use auto-detection for local development
  const hostname = window.location.hostname;
  const port = import.meta.env.VITE_API_PORT || '5000';
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  
  // If accessing via IP address or domain, use that; otherwise use localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}`;
  } else {
    // For deployed sites, warn if VITE_API_BASE_URL is not set
    if (hostname.includes('netlify.app') || hostname.includes('vercel.app') || hostname.includes('github.io')) {
      console.error('VITE_API_BASE_URL environment variable is not set! Please configure it in your deployment settings.');
      console.error('Current hostname:', hostname);
      console.error('Set VITE_API_BASE_URL to your backend URL (e.g., https://your-backend.onrender.com)');
    }
    return `${protocol}//${hostname}:${port}`;
  }
};

export const API_BASE = getApiBase();

// Log API base URL for debugging (always log to help with production debugging)
console.log('API Base URL:', API_BASE);
if (!import.meta.env.VITE_API_BASE_URL && !window.location.hostname.includes('localhost')) {
  console.warn('⚠️ VITE_API_BASE_URL is not set. Upload may fail. Set it in your deployment platform (Netlify/Render/etc.)');
}

export async function post(path, body) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res;
}

export async function get(path) {
  const res = await fetch(API_BASE + path);
  return res;
}
