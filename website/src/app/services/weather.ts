import { computed, effect, inject, Service, signal } from '@angular/core';
import { Geo } from './geo';
import { PulseBus } from '../core/bus';
import { forecastUrl, isFresh, parseForecast, precipToNoise, WeatherReading, windToAmp } from './forecast';
import { httpResource } from '@angular/common/http';

const CACHE_KEY = 'oscilla:weather';


/**
 * Weather from Open-Meteo. Feeds the signal's amplitude (wind) and noise (rain)
 *
 * The localStorage cache is not a luxury optimisation: this page opens dozens of
 * times a day, and without it that would be dozens of requests an hour
 * (Here I'm considering the extension option)
 */
@Service()
export class Weather {  private readonly geo = inject(Geo);
  private readonly bus = inject(PulseBus);

  private readonly coords = signal<{ lat: number; lon: number } | null>(null);
  private readonly cached = signal<WeatherReading | null>(this.readCache());
  private readonly failed = signal<string>('');

  // httpResource only fires when the cache is stale: the URL stays undefined otherwise
  private readonly res = httpResource<unknown>(() => {
    const c = this.coords();
    if (!c || isFresh(this.cached(), Date.now())) return undefined;
    return forecastUrl(c.lat, c.lon);
  });

  /**
   * Single source of truth for the panel. Deliberately not a computed calling
   * parseForecast(): that would use Date.now() inside a computed, recomputing a
   * different `at` on every read. The effect below takes care of it instead
   */
  readonly reading = this.cached.asReadonly();

  readonly status = computed<'acquiring' | 'ok' | 'nosignal'>(() => {
    if (this.reading()) return 'ok';
    if (this.failed()) return 'nosignal';
    return 'acquiring';
  });

  readonly reason = this.failed.asReadonly();

  constructor() {
    void this.locate();

    // Cache every good reading that comes off the network
    effect(() => {
      if (!this.res.hasValue()) return;
      const parsed = parseForecast(this.res.value(), Date.now());
      if (parsed) {
        this.cached.set(parsed);
        this.writeCache(parsed);
        this.failed.set('');
      } else {
        this.failed.set('unexpected response');
      }
    });

    effect(() => {
      if (this.res.error()) this.failed.set('network unreachable');
    });

    // The contribution to the signal: the only place weather touches the wave
    effect(() => {
      const r = this.reading();
      this.bus.contribute(
        'weather',
        r === null ? null : { freq: 0, amp: windToAmp(r.windKmh), noise: precipToNoise(r.precipMm) },
      );
    });
  }

  retry(): void {
    this.failed.set('');
    this.cached.set(null);
    localStorage.removeItem(CACHE_KEY);
    void this.locate();
    this.res.reload();
  }

  private async locate(): Promise<void> {
    const c = await this.geo.resolve();
    if (c) {
      this.coords.set(c);
    } else if (!this.cached()) {
      // No dash in here, the template already puts one in front
      this.failed.set('set a location in settings');
    }
  }

  private readCache(): WeatherReading | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const r = JSON.parse(raw) as WeatherReading;
      return isFresh(r, Date.now()) ? r : null;
    } catch {
      return null;
    }
  }

  private writeCache(r: WeatherReading): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(r));
    } catch {
      // Storage denied, without cache
    }
  }
}
