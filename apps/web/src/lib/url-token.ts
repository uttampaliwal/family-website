/**
 * Reads single-use tokens (email verification, password reset) from the URL
 * fragment. Email links carry `#token=…` so the secret never reaches the
 * server in query strings, Referer headers, or access logs.
 */
export function tokenFromHash(hash = window.location.hash): string {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(fragment).get("token") ?? "";
}
