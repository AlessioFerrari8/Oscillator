import { Injectable, signal } from '@angular/core';
import { DEFAULT_STATE, STORAGE_KEY, isObj, migrate, type OscillaState } from './state';

/** Write delay: without it we would hit the disk on every keystroke. */
export const SAVE_DEBOUNCE_MS = 250;

/** Sole owner of the persisted state. Widgets read it and call patch(). */
@Injectable({ providedIn: 'root' })
export class Store {
  private readonly inner = signal<OscillaState>(this.load());
  readonly state = this.inner.asReadonly();

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private load(): OscillaState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? migrate(JSON.parse(raw)) : structuredClone(DEFAULT_STATE);
    } catch {
      // Broken JSON or localStorage denied (private mode): start clean
      return structuredClone(DEFAULT_STATE);
    }
  }

  patch(p: Partial<OscillaState>): void {
    this.inner.set({ ...this.inner(), ...p });
    this.scheduleSave();
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inner()));
      } catch {
        // Quota full or storage denied: the page stays usable in memory
      }
    }, SAVE_DEBOUNCE_MS);
  }

  exportJson(): string {
    return JSON.stringify(this.inner(), null, 2);
  }

  /** true if the import succeeded. On invalid input it touches nothing */
  importJson(text: string): boolean {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return false;
    }
    if (!isObj(parsed)) return false;

    this.inner.set(migrate(parsed));
    this.scheduleSave();
    return true;
  }
}
