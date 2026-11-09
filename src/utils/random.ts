export type Rng = () => number;

/** Aléatoire cryptographique quand disponible (meilleur mélange que Math.random). */
export const secureRandom: Rng = () => {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
};

export function randInt(min: number, max: number, rng: Rng = secureRandom): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Fisher–Yates, retourne une copie. */
export function shuffle<T>(arr: readonly T[], rng: Rng = secureRandom): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(arr: readonly T[], rng: Rng = secureRandom): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function uid(): string {
  return Math.floor(secureRandom() * 1e12).toString(36) + Date.now().toString(36);
}
