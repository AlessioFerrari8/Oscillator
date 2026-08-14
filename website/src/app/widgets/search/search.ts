import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../../core/store';
import { PulseBus } from '../../core/bus';
import { ENGINES, type EngineId } from '../../core/state';
import { parseQuery, searchUrl } from './query';


@Component({
  selector: 'app-search',
  imports: [FormsModule],
  templateUrl: './search.html',
  styles: ``,
})
export class Search {
    private readonly store = inject(Store);
  private readonly bus = inject(PulseBus);

  protected readonly text = signal('');
  protected readonly engines = ENGINES;

  /** The default engine, the one the menu next to the bar shows. */
  protected readonly engine = computed(() => this.store.state().search.engine);

  /**
   * The engine that would actually fire, prefix included
   *
   * Kept apart from `engine()`: typing `g angular` must not change the saved
   * choice, it is an exception for one search only
   */
  protected readonly effective = computed(() => parseQuery(this.text(), this.engine()).engine);

  protected setEngine(value: string): void {
    if ((ENGINES as readonly string[]).includes(value)) {
      this.store.patch({ search: { engine: value as EngineId } });
      this.bus.transient(0.5);
    }
  }

  protected onInput(): void {
    // Every keystroke is a small pulse on the trace: the page reacts to you
    this.bus.transient(0.25);
  }

  protected submit(): void {
    const parsed = parseQuery(this.text(), this.engine());
    if (!parsed.terms) return;
    this.bus.transient(1);
    location.href = searchUrl(parsed);
  }

}
