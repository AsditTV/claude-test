import bankJson from './words.json';
import type { CustomPair, WordBank, WordCategory } from '../types';
import { KEYS, readJSON, writeJSON } from '../utils/storage';

export const wordBank = bankJson as WordBank;
export const builtInCategories: WordCategory[] = wordBank.categories;

export const CUSTOM_CATEGORY_ID = 'custom';

export function loadCustomPairs(): CustomPair[] {
  return readJSON<CustomPair[]>(KEYS.custom, []);
}

export function saveCustomPairs(pairs: CustomPair[]): void {
  writeJSON(KEYS.custom, pairs);
}

export function customCategory(pairs = loadCustomPairs()): WordCategory {
  return {
    id: CUSTOM_CATEGORY_ID,
    name: 'Mes mots',
    emoji: '✍️',
    pairs: pairs.map((p) => [p.a, p.b, p.level]),
  };
}

export const totalPairs = builtInCategories.reduce((n, c) => n + c.pairs.length, 0);
export const totalWords = new Set(builtInCategories.flatMap((c) => c.pairs.flatMap((p) => [p[0], p[1]]))).size;
