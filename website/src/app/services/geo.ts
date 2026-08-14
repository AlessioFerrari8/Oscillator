import { inject, Service } from '@angular/core';
import { Store } from '../core/store';

// Short timeout, the page does not wait for GPS to become usable
const GEO_TIMEOUT_MS = 6000;

const GEO_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Coordinates to use for the weather
 *
 * A denied permission is NOT an error: it falls back to the location saved by
 * hand in the settings. Only when that is missing too does it return null
 */
@Service()
export class Geo {
  private readonly store = inject(Store);
  
  async resolve(): Promise<{ lat: number; lon: number } | null> {
    const prefs = this.store.state().weather;

    if (prefs.mode === 'manual' && prefs.lat !== undefined && prefs.lon !== undefined) {
      return { lat: prefs.lat, lon: prefs.lon };
    }

    const fromBrowser = await this.ask();
    if (fromBrowser) return fromBrowser;

    if (prefs.lat !== undefined && prefs.lon !== undefined) {
      return { lat: prefs.lat, lon: prefs.lon };
    }
    return null;
  }

  private ask(): Promise<{ lat: number; lon: number } | null> {
    if (!navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => resolve(null),
        { timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS },
      );
    });
  }
}
