import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../../core/store';
import { PulseBus } from '../../core/bus';
import type { TaskItem } from '../../core/state';

/**
 * Task list. Also the first real source of the signal: the more that is due
 * today, the faster the beat. The widget has no idea a canvas exists
 */
@Component({
  selector: 'app-tasks',
  imports: [FormsModule],
  templateUrl: './tasks.html',
})
export class Tasks {

  protected readonly store = inject(Store);
  private readonly bus = inject(PulseBus);

  protected readonly draft = signal('');
  protected readonly draftDue = signal('');

  protected readonly open = computed(() => this.store.state().tasks.filter((t) => !t.done));

  protected readonly dueToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.open().filter((t) => t.due && t.due <= today);
  });

  constructor() {
    effect(() => {
      const open = this.open().length;
      const urgent = this.dueToday().length;
      // No open task, the source disappears entirely instead of contributing zero
      this.bus.contribute(
        'tasks',
        open === 0 ? null : { freq: Math.min(1, urgent / 3 + open / 12), amp: 0, noise: 0 },
      );
    });
  }

  protected add(): void {
    const text = this.draft().trim();
    if (!text) return;
    const due = this.draftDue();
    const item: TaskItem = {
      id: crypto.randomUUID(),
      text,
      due: due || undefined,
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.store.patch({ tasks: [...this.store.state().tasks, item] });
    this.draft.set('');
    this.draftDue.set('');
    this.bus.transient(1);
  }

  protected toggle(id: string): void {
    this.store.patch({
      tasks: this.store.state().tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    });
    this.bus.transient(0.6);
  }

  protected remove(id: string): void {
    this.store.patch({ tasks: this.store.state().tasks.filter((t) => t.id !== id) });
  }

  // true when the task is overdue or due today: the template highlights it
  protected isUrgent(t: TaskItem): boolean {
    return !t.done && !!t.due && t.due <= new Date().toISOString().slice(0, 10);
  }
}
