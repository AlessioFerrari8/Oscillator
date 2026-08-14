/**
 * Order of the panels in the grid. Pure: no DOM, no angular
 *
 * The reordering lives here and not in the component because it is the part
 * that holds the rules (duplicates, unknown ids, new panels) and the only one
 * worth testing without a browser
 */

export type PanelId = 'tasks' | 'weather' | 'links';

/** Factory order, and also the list of what counts as a valid panel */
export const PANELS: readonly PanelId[] = ['tasks', 'weather', 'links'];

const isPanel = (v: unknown): v is PanelId => PANELS.includes(v as PanelId);

/**
 * Turns whatever comes out of localStorage into a usable order
 *
 * Missing panels are appended instead of vanishing: someone with a layout saved
 * yesterday must not lose a panel added today
 */
export function sanitizeLayout(raw: unknown): PanelId[] {
  const kept: PanelId[] = [];
  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (isPanel(v) && !kept.includes(v)) kept.push(v);
    }
  }
  for (const p of PANELS) {
    if (!kept.includes(p)) kept.push(p);
  }
  return kept;
}

/**
 * Removes `dragged` and puts it back exactly **at the position** `target` had
 *
 * Not "before target": always inserting before would make the last slot of the
 * grid unreachable by dragging, dropping on the last panel would always land
 * you second to last
 */
export function moveTo(layout: readonly PanelId[], dragged: PanelId, target: PanelId): PanelId[] {
  if (dragged === target) return [...layout];
  const from = layout.indexOf(dragged);
  const to = layout.indexOf(target);
  if (from < 0 || to < 0) return [...layout];

  const next = [...layout];
  next.splice(from, 1);
  next.splice(to, 0, dragged);
  return next;
}

/** One-slot move, for anyone using the keyboard instead of the mouse. */
export function shift(layout: readonly PanelId[], id: PanelId, delta: -1 | 1): PanelId[] {
  const from = layout.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= layout.length) return [...layout];

  const next = [...layout];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
