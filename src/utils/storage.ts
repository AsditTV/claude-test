// Accès sûr au stockage du navigateur (peut être indisponible : navigation privée, etc.).

type Area = 'local' | 'session';

function area(a: Area): Storage | null {
  try {
    return a === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, a: Area = 'local'): T {
  try {
    const raw = area(a)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, a: Area = 'local'): void {
  try {
    area(a)?.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / privé : on ignore */
  }
}

export function readRaw(key: string, a: Area = 'local'): string | null {
  try {
    return area(a)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string, a: Area = 'local'): void {
  try {
    area(a)?.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function removeKey(key: string, a: Area = 'local'): void {
  try {
    area(a)?.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const KEYS = {
  settings: 'uc:settings',
  history: 'uc:history',
  custom: 'uc:custom',
  recent: 'uc:recent',
  game: 'uc:game',
  vault: 'uc:vault',
} as const;
