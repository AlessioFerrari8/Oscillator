import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../../core/store';
import { PulseBus } from '../../core/bus';
import { ACCENTS, ENGINES, type AccentId, type EngineId } from '../../core/state';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
})
export class Settings {
  protected readonly store = inject(Store);
  private readonly bus = inject(PulseBus);

  protected readonly accents = ACCENTS;
  protected readonly engines = ENGINES;
  protected readonly open = signal(false);
  protected readonly message = signal('');
  protected readonly importText = signal('');

  protected toggle(): void {
    this.open.update((v) => !v);
    this.message.set('');
  }

  protected setAccent(a: AccentId): void {
    this.store.patch({ theme: { accent: a } });
    this.bus.transient(0.5);
  }

  protected setEngine(e: EngineId): void {
    this.store.patch({ search: { engine: e } });
  }

  protected setCity(label: string, lat: string, lon: string): void {
    // Number('') is 0 and it is finite: without this check, hitting save on
    // empty fields would silently store 0,0 — the Gulf of Guinea
    if (!lat.trim() || !lon.trim()) {
      this.message.set('latitude and longitude are required');
      return;
    }
    const la = Number(lat);
    const lo = Number(lon);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) {
      this.message.set('latitude and longitude must be numbers');
      return;
    }
    if (la < -90 || la > 90 || lo < -180 || lo > 180) {
      this.message.set('latitude -90..90, longitude -180..180');
      return;
    }
    this.store.patch({ weather: { mode: 'manual', lat: la, lon: lo, label: label.trim() } });
    this.message.set('location saved — reload to refresh weather');
  }

  protected copyExport(): void {
    // The message follows the real outcome: saying "copied" when the browser
    // denied the clipboard would send the user off to paste nothing
    navigator.clipboard.writeText(this.store.exportJson()).then(
      () => this.message.set('settings copied to clipboard'),
      () => this.message.set('clipboard blocked — use export from the console'),
    );
  }

  protected doImport(): void {
    this.message.set(this.store.importJson(this.importText()) ? 'imported' : 'invalid json');
  }
}
