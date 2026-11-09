import type { GameMode, GameOptions, GameSettings } from '../types';
import { maxImpostors, recommendComposition, validateComposition, MIN_PLAYERS, MAX_PLAYERS } from './game';
import { KEYS, readJSON, writeJSON } from './storage';
import { CUSTOM_CATEGORY_ID } from '../data/words';

export const DEFAULT_OPTIONS: GameOptions = {
  votesEnabled: true,
  cluesEnabled: false,
  randomOrder: true,
  speakingTimer: 0,
  hiddenRoles: false,
  showRules: true,
};

export const MODES: { id: GameMode; label: string; emoji: string; desc: string }[] = [
  { id: 'classique', label: 'Classique', emoji: '🕵️', desc: 'Les règles originales' },
  { id: 'rapide', label: 'Rapide', emoji: '⚡', desc: 'Chrono 20 s, sans règles' },
  { id: 'sans-mrwhite', label: 'Sans Mr White', emoji: '🚫', desc: 'Civils contre Undercover' },
  { id: 'chaos', label: 'Chaos', emoji: '🌀', desc: 'Plusieurs Undercover + Mr White' },
  { id: 'perso', label: 'Mes mots', emoji: '✍️', desc: 'Vos propres paires' },
];

export function defaultSettings(): GameSettings {
  const names = ['', '', '', '', ''];
  const c = recommendComposition(names.length);
  return {
    gameName: '',
    playerNames: names,
    undercoverCount: c.undercover,
    mrWhiteCount: c.mrWhite,
    categoryIds: [],
    surprise: false,
    difficulty: 'normal',
    mode: 'classique',
    includeCustom: false,
    options: { ...DEFAULT_OPTIONS },
  };
}

/** Composition propre au mode choisi. */
export function compositionForMode(mode: GameMode, n: number) {
  if (mode === 'chaos') {
    const total = maxImpostors(n);
    const mrWhite = n >= 9 ? 2 : n >= 5 ? 1 : 0;
    return { undercover: Math.max(1, total - mrWhite), mrWhite: total - Math.max(1, total - mrWhite) };
  }
  const c = recommendComposition(n, mode !== 'sans-mrwhite');
  return { undercover: c.undercover, mrWhite: c.mrWhite };
}

/** Applique les préréglages d'un mode. */
export function applyMode(s: GameSettings, mode: GameMode): GameSettings {
  const n = s.playerNames.length;
  const comp = compositionForMode(mode, n);
  const options: GameOptions = {
    ...s.options,
    speakingTimer: mode === 'rapide' ? 20 : 0,
    showRules: mode !== 'rapide',
  };
  return {
    ...s,
    mode,
    ...{ undercoverCount: comp.undercover, mrWhiteCount: comp.mrWhite },
    includeCustom: mode === 'perso' ? true : s.includeCustom,
    categoryIds: mode === 'perso' ? [CUSTOM_CATEGORY_ID] : s.categoryIds.filter((id) => id !== CUSTOM_CATEGORY_ID),
    surprise: mode === 'perso' ? false : s.surprise,
    options,
  };
}

export function loadSettings(): GameSettings {
  const saved = readJSON<Partial<GameSettings> | null>(KEYS.settings, null);
  const base = defaultSettings();
  if (!saved) return base;
  const merged: GameSettings = { ...base, ...saved, options: { ...base.options, ...(saved.options ?? {}) } };
  // Sécurité : on reprend une configuration toujours valide.
  const n = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, merged.playerNames.length));
  merged.playerNames = merged.playerNames.slice(0, n);
  while (merged.playerNames.length < n) merged.playerNames.push('');
  if (validateComposition(n, merged.undercoverCount, merged.mrWhiteCount)) {
    const c = recommendComposition(n);
    merged.undercoverCount = c.undercover;
    merged.mrWhiteCount = c.mrWhite;
  }
  return merged;
}

export function saveSettings(s: GameSettings): void {
  writeJSON(KEYS.settings, s);
}

/** Noms définitifs : vides → « Joueur N ». */
export function resolveNames(names: string[]): string[] {
  return names.map((n, i) => n.trim() || `Joueur ${i + 1}`);
}

export function duplicateNames(names: string[]): Set<number> {
  const resolved = resolveNames(names).map((n) => n.toLowerCase());
  const dup = new Set<number>();
  resolved.forEach((n, i) => {
    if (resolved.indexOf(n) !== i) {
      dup.add(i);
      dup.add(resolved.indexOf(n));
    }
  });
  return dup;
}
