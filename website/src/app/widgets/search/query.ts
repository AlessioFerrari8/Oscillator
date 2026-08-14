import type { EngineId } from '../../core/state';

/** prefixes */
export const PREFIXES: Readonly<Record<string, EngineId>> = {
  g: 'google',
  d: 'ddg',
  y: 'youtube',
  w: 'wikipedia',
  h: 'github',
  '!g': 'google',
  '!wiki': 'wikipedia',
  '!yt': 'youtube',
  '!gh': 'github',
};

export interface ParsedQuery {
  engine: EngineId;
  terms: string;
}

const ENDPOINTS: Readonly<Record<EngineId, string>> = {
  ddg: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  wikipedia: 'https://en.wikipedia.org/w/index.php?search=',
  youtube: 'https://www.youtube.com/results?search_query=',
  github: 'https://github.com/search?q=',
};

/**
 * Splits "g angular signals" into engine + terms
 *
 * A prefix only counts when followed by at least one term: "g" on its own is a
 * search for the letter g, not an empty engine choice
 */
export function parseQuery(raw: string, fallback: EngineId): ParsedQuery {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const space = trimmed.indexOf(' ');
  if (space > 0) {
    const head = trimmed.slice(0, space).toLowerCase();
    // Object.hasOwn and not `PREFIXES[head]`: head comes from the user, and an
    // inherited key like `constructor` or `__proto__` would pass for a valid prefix
    if (Object.hasOwn(PREFIXES, head)) {
      return { engine: PREFIXES[head], terms: trimmed.slice(space + 1) };
    }
  }
  return { engine: fallback, terms: trimmed };
}

export function searchUrl(p: ParsedQuery): string {
  return ENDPOINTS[p.engine] + encodeURIComponent(p.terms);
}
