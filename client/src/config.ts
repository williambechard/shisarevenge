// Client configuration. VITE_SERVER_URL is set in the Vercel dashboard for production.

const DEFAULT_SERVER_URL = 'http://localhost:3001';

export function resolveServerUrl(value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_SERVER_URL;
  }
  return value.replace(/\/+$/, '');
}

export function serverUrl(): string {
  return resolveServerUrl(import.meta.env.VITE_SERVER_URL);
}
