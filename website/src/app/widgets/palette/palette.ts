import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../../core/store';
import { PulseBus } from '../../core/bus';
import { ACCENTS, type AccentId } from '../../core/state';

export interface Command {
  id: string;
  label: string;
  run(): void;
}

// Ctrl+K: everything the page can do, without hunting for it with the mouse
@Component({
  selector: 'app-palette',
  imports: [FormsModule],
  templateUrl: './palette.html',
})
export class Palette {
  private readonly store = inject(Store);
  private readonly bus = inject(PulseBus);

  protected readonly open = signal(false);
  protected readonly filter = signal('');

  private readonly all = computed<Command[]>(() => [
    ...ACCENTS.map((a: AccentId) => ({
      id: `accent:${a}`,
      label: `phosphor: ${a}`,
      run: () => this.store.patch({ theme: { accent: a } }),
    })),
    {
      id: 'export',
      label: 'export settings to clipboard',
      run: () => void navigator.clipboard.writeText(this.store.exportJson()),
    },
    {
      id: 'clear-done',
      label: 'clear completed tasks',
      run: () => this.store.patch({ tasks: this.store.state().tasks.filter((t) => !t.done) }),
    },
  ]);

  protected readonly visible = computed(() => {
    const q = this.filter().trim().toLowerCase();
    return q ? this.all().filter((c) => c.label.toLowerCase().includes(q)) : this.all();
  });

  constructor() {
    addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.open()) {
        this.close();
      } else if (e.key === '/' && !this.open() && !this.isTyping(e)) {
        e.preventDefault();
        document.getElementById('search-field')?.focus();
      }
    });
  }

  private isTyping(e: KeyboardEvent): boolean {
    const el = e.target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  protected toggle(): void {
    this.open() ? this.close() : this.show();
  }

  private show(): void {
    this.filter.set('');
    this.open.set(true);
    this.bus.transient(0.8);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected run(c: Command): void {
    c.run();
    this.bus.transient(1);
    this.close();
  }
}
