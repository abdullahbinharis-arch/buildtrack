/**
 * Wraps fetch() to automatically include the API key from sessionStorage.
 * Falls back to regular fetch if no key is stored (dev mode).
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const key =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('buildtrack_key')
      : null;

  const headers = new Headers(init?.headers);

  if (key) {
    headers.set('x-api-key', key);
  }

  return fetch(input, { ...init, headers });
}
