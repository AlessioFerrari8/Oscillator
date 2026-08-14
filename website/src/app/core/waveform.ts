/**
 * This class contains the sampled oscilloscope signal
 *
 * Deliberately pure and deterministic: the noise comes from a hash of (x, t), not
 * from Math.random(). Without this, the signal would not be testable and two consecutive
 * frames would bear no relation to each other
 */

export interface PulseContribution {
  // accelleration of the pulse 0..1
  freq: number;
  // how much the wave raises 0..1
  amp: number;
  // noise 0..1
  noise: number;
}

export interface Transient {
  // birdth instant, in ms
  at: number;
  // strength of signal 0..1
  strength: number;
}

// time constant of a transient decay
export const TRANSIENT_TAU_MS = 450;

// trasient is considered to have decay
const TRANSIENT_LIFETIME = 6;

// min amplitude
const BASE_AMP = 0.18;

// cycles
const CYCLES_MIN = 2;
const CYCLES_MAX = 9;

// horizontal scrolling speed, cycles/second
const SCROLL_HZ = 0.35;

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const clamp11 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(-1, v)) : 0);


/**
 * Merges the contribution of all sorgents into one.
 *
 * The result is a saturated sum, not an average: three weak sources must be able to produce a
 ​​* strong signal, but no combination can fall outside the [0, 1] range
 */
export function aggregate(contributions: Iterable<PulseContribution>): PulseContribution {
  let freq = 0;
  let amp = 0;
  let noise = 0;

  for (const c of contributions) {
    freq += clamp01(c.freq);
    amp += clamp01(c.amp);
    noise += clamp01(c.noise);
  }

  return {
    freq: clamp01(freq),
    amp: clamp01(BASE_AMP + amp),
    noise: clamp01(noise),
  };
}

/**
 * Deterministic noise in [-1, 1]. 32-bit integer hash based on quantized (x, t):
 * low-cost, performs no allocation, and returns the same value for the same inputs
 */
function hashNoise(x: number, t: number): number {
  let h = Math.imul(Math.round(x * 4096), 0x27d4eb2d) ^ Math.imul(Math.round(t), 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 0xffffffff * 2 - 1;
}

/** Contribution of transients at a given instant: exponentially decaying pulses */
function transientEnergy(transients: readonly Transient[], tMs: number): number {
  let sum = 0;
  for (const tr of transients) {
    const age = tMs - tr.at;
    if (age < 0 || age > TRANSIENT_TAU_MS * TRANSIENT_LIFETIME) continue;
    sum += clamp01(tr.strength) * Math.exp(-age / TRANSIENT_TAU_MS);
  }
  return sum;
}

/**
 * Value of the track at point x (0 = left edge, 1 = right)
 * at time tMs. Always in the range [-1, 1]
 */
export function sample(
  agg: PulseContribution,
  transients: readonly Transient[],
  x: number,
  tMs: number,
): number {
  const cycles = CYCLES_MIN + agg.freq * (CYCLES_MAX - CYCLES_MIN);
  const phase = (tMs / 1000) * SCROLL_HZ;
  const carrier = Math.sin(2 * Math.PI * (x * cycles + phase));

  // Second harmonic: on its own, the pure sine wave looks like a decoration, not a signal
  const harmonic = 0.3 * Math.sin(2 * Math.PI * (x * cycles * 2 + phase * 1.7));

  const body = agg.amp * (carrier + harmonic) * 0.77;
  // 0.07, not 0.25: the noise should add texture to the line, not fill the screen
  // At 0.25, during heavy rain, each column would jump by ~84 px and the trace
  // would turn into a solid mass that obscured the text behind it
  const grain = agg.noise * 0.07 * hashNoise(x, Math.round(tMs / 40));
  const spike = transientEnergy(transients, tMs) * 0.6 * Math.sin(2 * Math.PI * x * 40);

  return clamp11(body + grain + spike);
}

/** Removes expired transients from the list so it does not grow indefinitely */
export function pruneTransients(transients: readonly Transient[], nowMs: number): Transient[] {
  const cutoff = TRANSIENT_TAU_MS * TRANSIENT_LIFETIME;
  return transients.filter((tr) => nowMs - tr.at <= cutoff);
}



