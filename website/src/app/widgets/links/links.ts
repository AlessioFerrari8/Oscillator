import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../../core/store';
import { PulseBus } from '../../core/bus';
import type { LinkItem } from '../../core/state';
import { normalizeUrl, faviconUrl, initialOf } from './url';

@Component({
  selector: 'app-links',
  imports: [FormsModule],
  templateUrl: './links.html',
})
export class Links {
  private readonly store = inject(Store);
  private readonly bus = inject(PulseBus);

  protected readonly editing = signal(false);
  protected readonly draftLabel = signal('');
  protected readonly draftUrl = signal('');
  protected readonly error = signal('');

  protected readonly items = computed(() =>
    [...this.store.state().links].sort((a, b) => a.order - b.order),
  );

  protected icon = faviconUrl;
  protected initial = initialOf;

  protected open(): void {
    this.bus.transient(1);
  }

  protected add(): void {
    const url = normalizeUrl(this.draftUrl());
    if (!url) {
      this.error.set('only http and https links');
      return;
    }
    const label = this.draftLabel().trim() || new URL(url).hostname;
    const item: LinkItem = {
      id: crypto.randomUUID(),
      label,
      url,
      order: this.items().length,
    };
    this.store.patch({ links: [...this.store.state().links, item] });
    this.draftLabel.set('');
    this.draftUrl.set('');
    this.error.set('');
    this.bus.transient(0.7);
  }

  protected remove(id: string): void {
    this.store.patch({ links: this.store.state().links.filter((l) => l.id !== id) });
  }

  protected toggleEdit(): void {
    this.editing.update((v) => !v);
    this.error.set('');
  }

  // When the favicon is missing we show the initial, not a broken icon
  protected onIconError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
