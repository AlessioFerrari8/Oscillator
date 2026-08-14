// Only these schemes become clickable links
const ALLOWED = new Set(['http:', 'https:']);

/**
 * Turns whatever the user typed into a safe url, or null
 *
 * The case that really matters is `javascript:`: a bookmark is user-written text
 * that later becomes an href, so it has to be filtered here and nowhere else
 */
export function normalizeUrl(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;

  try {
    const u = new URL(withScheme);
    if (!ALLOWED.has(u.protocol)) return null;
    if (!u.hostname) return null;
    return u.href;
  } catch {
    return null;
  }
}

/**
 * Favicon taken from the site itself
 *
 * Not from Google's favicon service: that would hand it the complete bookmark
 * list of whoever uses the page, which is exactly the kind of leak a new tab
 * must not have
 */
export function faviconUrl(url: string): string | null {
  try {
    return new URL('/favicon.ico', url).href;
  } catch {
    return null;
  }
}

// Fallback for when the favicon does not load
export function initialOf(label: string): string {
  return label.trim().charAt(0).toUpperCase() || '?';
}
