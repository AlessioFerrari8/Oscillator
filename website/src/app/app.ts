import { Component, computed, effect, inject, signal } from '@angular/core';
import { Scope } from './scope/scope';
import { Search } from './widgets/search/search';
import { Palette } from './widgets/palette/palette';
import { Tasks } from './widgets/tasks/tasks';
import { WeatherPanel } from './widgets/weather/weather';
import { Links } from './widgets/links/links';
import { Settings } from './widgets/settings/settings';
import { Boot } from './widgets/boot/boot';
import { Store } from './core/store';
import { PulseBus } from './core/bus';
import { moveTo, shift, type PanelId } from './core/layout';

@Component({
  selector: 'app-root',
  imports: [Scope, Search, Palette, Tasks, Links, Settings, WeatherPanel, Boot],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('website');

  private readonly store = inject(Store);
  private readonly bus = inject(PulseBus);

  protected readonly now = signal(new Date());

  protected readonly layout = computed(() => this.store.state().layout);

  // The panel being dragged only used to fade it while it is in flight
  protected readonly dragged = signal<PanelId | null>(null);

  constructor() {
    // The only place the theme touches the DOM
    effect(() => {
      document.documentElement.dataset['accent'] = this.store.state().theme.accent;
    });

    // Base carrier, always there, even on a completely empty page
    this.bus.contribute('clock', { freq: 0.12, amp: 0.1, noise: 0 });

    setInterval(() => {
      this.now.set(new Date());
      this.bus.transient(0.4);
    }, 60_000);
  }

  protected clock(): string {
    return this.now().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  protected onDragStart(event: DragEvent, id: PanelId): void {
    this.dragged.set(id);
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    // Firefox does not start the drag if dataTransfer stays empty
    event.dataTransfer.setData('text/plain', id);
    // You drag the grip, but the preview has to be the whole panel
    const cell = (event.target as HTMLElement).closest('.grid__cell');
    if (cell) event.dataTransfer.setDragImage(cell, 20, 20);
  }

  protected onDragOver(event: DragEvent): void {
    // Without preventDefault the drop never happens at all, it is how a zone
    // declares it accepts what is coming
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  protected onDrop(event: DragEvent, target: PanelId): void {
    event.preventDefault();
    const from = this.dragged();
    this.dragged.set(null);
    if (!from || from === target) return;
    this.store.patch({ layout: moveTo(this.layout(), from, target) });
    this.bus.transient(0.8);
  }

  protected onDragEnd(): void {
    this.dragged.set(null);
  }

  // Arrow keys on the grip, reordering must not require a mouse
  protected onGripKey(event: KeyboardEvent, id: PanelId): void {
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1
      : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : 0;
    if (delta === 0) return;

    event.preventDefault();
    this.store.patch({ layout: shift(this.layout(), id, delta as -1 | 1) });
    this.bus.transient(0.8);
    // Focus follows the panel, otherwise after one arrow key you would move its neighbour
    const grip = event.target as HTMLElement;
    requestAnimationFrame(() => grip.focus());
  }

  protected position(id: PanelId): string {
    return `${this.layout().indexOf(id) + 1} of ${this.layout().length}`;
  }
}
