import { Injectable, computed, signal } from '@angular/core';
import {
  aggregate, pruneTransients,
  type PulseContribution, type Transient,
} from './waveform';

/**
 * Registry of every contribution to the signal
 *
 * The whole point: widgets declare here what they want the wave to do and never
 * touch the canvas. The canvas only reads the aggregate and has no idea tasks or
 * weather exist.
 */
@Injectable({ providedIn: 'root' })
export class PulseBus {
  private readonly sources = signal<ReadonlyMap<string, PulseContribution>>(new Map());
  private transients: Transient[] = [];

  readonly aggregated = computed(() => aggregate(this.sources().values()));

  /**
   * Registers or updates one source's contribution; `null` removes it
   *
   * `update()` and not `set(new Map(this.sources()))`: widgets call this method
   * from inside an `effect`, and reading the signal in a tracked way there would
   * make the effect depend on what it writes itself, it would wake itself up on
   * every round, forever. `update` reads the value without tracking it. For the
   * same reason, when nothing changes we return the identical map: same
   * reference, no notification to readers
   */
  contribute(sourceId: string, c: PulseContribution | null): void {
    this.sources.update((current) => {
      if (c === null) {
        if (!current.has(sourceId)) return current;
        const next = new Map(current);
        next.delete(sourceId);
        return next;
      }
      const prev = current.get(sourceId);
      if (prev && prev.freq === c.freq && prev.amp === c.amp && prev.noise === c.noise) {
        return current;
      }
      return new Map(current).set(sourceId, c);
    });
  }

  /**
   * One-off pulse: a keystroke, opening the palette, clicking a link
   * It does not go through signals because the draw loop reads it on every
   * frame, and it must not trigger change detection 60 times a second
   */
  transient(strength: number, nowMs: number = performance.now()): void {
    this.transients = pruneTransients(this.transients, nowMs);
    this.transients.push({ at: nowMs, strength });
  }

  activeTransients(nowMs: number): Transient[] {
    this.transients = pruneTransients(this.transients, nowMs);
    return this.transients;
  }
}
