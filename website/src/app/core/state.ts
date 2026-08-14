/** types, defaults and migration of the persisted state. No angualr dependency */

import { PANELS, sanitizeLayout, type PanelId } from './layout';


export type AccentId = 'p1' | 'p3' | 'cyan';
export type EngineId = 'ddg' | 'google' | 'wikipedia' | 'youtube' | 'github';

export const ACCENTS: readonly AccentId[] = ['p1', 'p3', 'cyan'];
export const ENGINES: readonly EngineId[] = ['ddg', 'google', 'wikipedia', 'youtube', 'github'];

export interface TaskItem {
  id: string;
  text: string;
  /** ISO yyyy-mm-dd, optional */
  due?: string;
  done: boolean;
  createdAt: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  order: number;
}

export interface WeatherPrefs {
  mode: 'geo' | 'manual';
  lat?: number;
  lon?: number;
  label?: string;
}

export interface OscillaState {
  v: number;
  theme: { accent: AccentId };
  search: { engine: EngineId };
  tasks: TaskItem[];
  links: LinkItem[];
  weather: WeatherPrefs;
  /** order of the panels in the grid, draggable by the user */
  layout: PanelId[];
}

export const STORAGE_KEY = 'oscilla:v1';
export const CURRENT_VERSION = 1;



// basic links
export const DEFAULT_STATE: OscillaState = {
  v: CURRENT_VERSION,
  theme: { accent: 'p1' },
  search: { engine: 'ddg' },
  tasks: [],
  links: [
    { id: 'gh', label: 'github',   url: 'https://github.com',           order: 0 },
    { id: 'yt', label: 'youtube',  url: 'https://youtube.com',          order: 1 },
    { id: 'ml', label: 'mail',     url: 'https://mail.google.com',      order: 2 },
    { id: 'dr', label: 'drive',    url: 'https://drive.google.com',     order: 3 },
  ],
  weather: { mode: 'geo' },
  layout: [...PANELS],
};

export const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

function toTask(v: unknown): TaskItem | null {
  if (!isObj(v)) return null;
  if (typeof v['id'] !== 'string' || typeof v['text'] !== 'string') return null;
  return {
    id: v['id'],
    text: v['text'],
    due: typeof v['due'] === 'string' ? v['due'] : undefined,
    done: v['done'] === true,
    createdAt: str(v['createdAt'], new Date().toISOString()),
  };
}

function toLink(v: unknown, i: number): LinkItem | null {
  if (!isObj(v)) return null;
  if (typeof v['id'] !== 'string' || typeof v['url'] !== 'string') return null;
  return {
    id: v['id'],
    label: str(v['label'], v['url']),
    url: v['url'],
    order: typeof v['order'] === 'number' ? v['order'] : i,
  };
}

/**
 * Turns whatever comes out of localStorage into a valid state
 *
 * It never throws: a new tab that refuses to open because the JSON is corrupt
 * would be the worst possible way to fail in this project
 */
export function migrate(raw: unknown): OscillaState {
  if (!isObj(raw) || raw['v'] !== CURRENT_VERSION) return structuredClone(DEFAULT_STATE);

  const theme = isObj(raw['theme']) ? raw['theme'] : {};
  const search = isObj(raw['search']) ? raw['search'] : {};
  const weather = isObj(raw['weather']) ? raw['weather'] : {};

  const accent = theme['accent'];
  const engine = search['engine'];

  const tasks = Array.isArray(raw['tasks'])
    ? raw['tasks'].map(toTask).filter((t): t is TaskItem => t !== null)
    : [];
  const links = Array.isArray(raw['links'])
    ? raw['links'].map(toLink).filter((l): l is LinkItem => l !== null)
    : structuredClone(DEFAULT_STATE.links);

  return {
    v: CURRENT_VERSION,
    theme: { accent: ACCENTS.includes(accent as AccentId) ? (accent as AccentId) : DEFAULT_STATE.theme.accent },
    search: { engine: ENGINES.includes(engine as EngineId) ? (engine as EngineId) : DEFAULT_STATE.search.engine },
    tasks,
    links,
    // Field added later: someone with a saved state that has no `layout` must
    // not lose tasks and bookmarks, so no version bump, it falls back to the
    // factory order
    layout: sanitizeLayout(raw['layout']),
    weather: {
      mode: weather['mode'] === 'manual' ? 'manual' : 'geo',
      lat: typeof weather['lat'] === 'number' ? weather['lat'] : undefined,
      lon: typeof weather['lon'] === 'number' ? weather['lon'] : undefined,
      label: typeof weather['label'] === 'string' ? weather['label'] : undefined,
    },
  };
}


