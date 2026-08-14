/**
 * Open-Meteo: URL, parsing and freshness. All pure
 *
 * Keyless by choice: a static build has nowhere to hide a key, so
 * either the API does not want one or you need a backend
 */

export interface WeatherReading {
  tempC: number;
  windKmh: number;
  precipMm: number;
  code: number;
  // instant of reading
  at: number;
}

// Reopening the new tab five times in a minute must not fire five requests
export const WEATHER_TTL_MS = 10 * 60 * 1000;

// Above this speed wind stops raising the wave: you could not tell the difference so it's pointless
const WIND_FULL_SCALE_KMH = 40;
const PRECIP_FULL_SCALE_MM = 5;

export function forecastUrl(lat: number, lon: number): string {
  const q = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'temperature_2m,wind_speed_10m,precipitation,weather_code',
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// null when the response is not the expected shape: the caller shows no signal
export function parseForecast(json: unknown, nowMs: number): WeatherReading | null {
  if (typeof json !== 'object' || json === null) return null;
  const current = (json as Record<string, unknown>)['current'];
  if (typeof current !== 'object' || current === null) return null;

  const c = current as Record<string, unknown>;
  const tempC = num(c['temperature_2m']);
  const windKmh = num(c['wind_speed_10m']);
  const precipMm = num(c['precipitation']);
  const code = num(c['weather_code']);
  if (tempC === null || windKmh === null || precipMm === null || code === null) return null;

  return { tempC, windKmh, precipMm, code, at: nowMs };
}

export function isFresh(r: WeatherReading | null, nowMs: number): boolean {
  return r !== null && nowMs - r.at < WEATHER_TTL_MS;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function windToAmp(windKmh: number): number {
  return clamp01(windKmh / WIND_FULL_SCALE_KMH);
}

export function precipToNoise(precipMm: number): number {
  return clamp01(precipMm / PRECIP_FULL_SCALE_MM);
}
