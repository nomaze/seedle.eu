/**
 * Deterministic pseudo-random number generator for synthetic datasets.
 *
 * Ensures idempotent, reproducible outputs across identical inputs
 * using string-keyed seeds rather than nondeterministic Math.random().
 */

/** 32-bit hash of a string (cyrb53 truncated to 32 bits). Always non-negative. */
export function hashString(text: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ((h2 >>> 0) ^ (h1 >>> 0)) >>> 0;
}

/** Uniformly distributed pseudo-random float generator in [0, 1) using mulberry32. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Instantiates a PRNG from a string seed key (e.g. `rng("ertrag:site-3:2022")`). */
export function rng(key: string): () => number {
  return seededRandom(hashString(key));
}

/** Generates standard normal distribution variate (Box-Muller, mean 0, SD 1). */
export function gauss(random: () => number): number {
  const u = Math.max(random(), 1e-12);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Deterministic Gaussian noise offset for a given seed key. */
export function noise(key: string, sd = 1): number {
  return gauss(rng(key)) * sd;
}
