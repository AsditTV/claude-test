// Logique de jeu PURE (aucune dépendance à React ni au stockage) → testable.
import type {
  Difficulty,
  PairLevel,
  Role,
  WordCategory,
  WordPairTuple,
  Winner,
} from '../types';
import { type Rng, secureRandom, shuffle, randInt } from './random';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

export interface Composition {
  undercover: number;
  mrWhite: number;
  civils: number;
}

/** Nombre max d'imposteurs (undercover + Mr White) : il faut une majorité stricte de civils. */
export function maxImpostors(n: number): number {
  return Math.max(1, Math.floor((n - 1) / 2));
}

/** Retourne un message d'erreur si la composition est impossible, sinon null. */
export function validateComposition(n: number, undercover: number, mrWhite: number): string | null {
  if (!Number.isInteger(n) || n < MIN_PLAYERS) return `Il faut au moins ${MIN_PLAYERS} joueurs.`;
  if (n > MAX_PLAYERS) return `Maximum ${MAX_PLAYERS} joueurs.`;
  if (undercover < 0 || mrWhite < 0) return 'Valeurs négatives interdites.';
  if (undercover + mrWhite < 1) return 'Il faut au moins un Undercover ou un Mr White.';
  const civils = n - undercover - mrWhite;
  if (civils <= undercover + mrWhite)
    return `Trop d'imposteurs : il faut plus de civils (${civils}) que d'imposteurs (${undercover + mrWhite}).`;
  return null;
}

/** Répartition « intelligente » recommandée. */
export function recommendComposition(n: number, allowMrWhite = true): Composition {
  // ~30 % d'imposteurs : 3-4 j → 1 U · 5-8 j → 1 U + 1 W · 9-12 j → 2 U + 1 W · 13+ j → 2 W
  const total = Math.min(maxImpostors(n), Math.max(1, Math.round(n * 0.3)));
  const wanted = allowMrWhite && n >= 5 ? (n >= 13 ? 2 : 1) : 0;
  const mrWhite = Math.min(wanted, total - 1);
  const undercover = total - mrWhite;
  return { undercover, mrWhite, civils: n - total };
}

/** Composition aléatoire mais équilibrée (20 % à 40 % d'imposteurs). */
export function randomComposition(n: number, allowMrWhite = true, rng: Rng = secureRandom): Composition {
  const max = maxImpostors(n);
  const lo = Math.min(max, Math.max(1, Math.ceil(n * 0.2)));
  const hi = Math.min(max, Math.max(lo, Math.floor(n * 0.4)));
  const total = randInt(lo, hi, rng);
  const maxWhite = allowMrWhite ? Math.min(2, total - 1, n >= 4 ? 2 : 0) : 0;
  const mrWhite = maxWhite > 0 ? randInt(0, maxWhite, rng) : 0;
  const undercover = total - mrWhite;
  return { undercover, mrWhite, civils: n - total };
}

/** Attribution aléatoire des rôles. */
export function assignRoles(
  playerIds: string[],
  undercover: number,
  mrWhite: number,
  rng: Rng = secureRandom,
): Record<string, Role> {
  const err = validateComposition(playerIds.length, undercover, mrWhite);
  if (err) throw new Error(err);
  const deck: Role[] = [
    ...Array<Role>(undercover).fill('undercover'),
    ...Array<Role>(mrWhite).fill('mrwhite'),
    ...Array<Role>(playerIds.length - undercover - mrWhite).fill('civil'),
  ];
  const shuffled = shuffle(deck, rng);
  const roles: Record<string, Role> = {};
  playerIds.forEach((id, i) => (roles[id] = shuffled[i]));
  return roles;
}

/**
 * Ordre de parole. Règle classique : Mr White ne parle jamais en premier
 * (il n'aurait aucun indice sur lequel s'appuyer).
 */
export function buildSpeakingOrder(
  aliveIds: string[],
  roles: Record<string, Role>,
  random: boolean,
  rng: Rng = secureRandom,
): string[] {
  const order = random ? shuffle(aliveIds, rng) : aliveIds.slice();
  if (order.length > 1 && roles[order[0]] === 'mrwhite') {
    const idx = order.findIndex((id) => roles[id] !== 'mrwhite');
    if (idx > 0) {
      if (random) {
        [order[0], order[idx]] = [order[idx], order[0]];
      } else {
        // Ordre fixe : on fait simplement tourner la liste.
        return [...order.slice(idx), ...order.slice(0, idx)];
      }
    }
  }
  return order;
}

/**
 * Conditions de victoire (sur les joueurs ENCORE EN VIE).
 * - Civils : plus aucun Undercover ni Mr White.
 * - Imposteurs : (Undercover + Mr White) ≥ civils restants.
 */
export function checkWinner(aliveRoles: Role[]): Winner | null {
  const c = aliveRoles.filter((r) => r === 'civil').length;
  const u = aliveRoles.filter((r) => r === 'undercover').length;
  const w = aliveRoles.filter((r) => r === 'mrwhite').length;
  if (u === 0 && w === 0) return 'civils';
  if (u + w >= c) {
    if (u > 0 && w > 0) return 'imposteurs';
    return u > 0 ? 'undercover' : 'mrwhite';
  }
  return null;
}

/** Un joueur a-t-il gagné, selon son rôle et l'équipe victorieuse ? */
export function didRoleWin(role: Role, winner: Winner): boolean {
  switch (winner) {
    case 'civils':
      return role === 'civil';
    case 'undercover':
      return role === 'undercover';
    case 'mrwhite':
      return role === 'mrwhite';
    case 'imposteurs':
      return role !== 'civil';
  }
}

export interface Tally {
  counts: Record<string, number>;
  max: number;
  leaders: string[];
}

export function tallyVotes(votes: Record<string, string>, candidates: string[]): Tally {
  const counts: Record<string, number> = {};
  candidates.forEach((c) => (counts[c] = 0));
  Object.values(votes).forEach((target) => {
    if (target in counts) counts[target]++;
  });
  const max = Math.max(0, ...Object.values(counts));
  const leaders = candidates.filter((c) => counts[c] === max);
  return { counts, max, leaders };
}

// ── Devinette de Mr White ─────────────────────────────────────

export function normalizeWord(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^(le|la|les|l'|un|une|des|du|de la)\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[a.length][b.length];
}

/** Tolère accents, majuscules, articles, tirets et une faute de frappe sur les mots longs. */
export function isGuessCorrect(guess: string, word: string): boolean {
  const g = normalizeWord(guess);
  const w = normalizeWord(word);
  if (!g) return false;
  if (g === w) return true;
  // pluriel simple
  if (g === w + 's' || g + 's' === w || g === w + 'x' || g + 'x' === w) return true;
  return w.length >= 6 && levenshtein(g, w) <= 1;
}

// ── Sélection des mots ───────────────────────────────────────

export const DIFFICULTY_LEVEL: Record<Difficulty, PairLevel> = {
  facile: 1,
  normal: 2,
  difficile: 3,
};

export interface PickedPair {
  civilWord: string;
  undercoverWord: string;
  categoryId: string;
  categoryName: string;
  key: string;
}

export function pairKey(p: WordPairTuple): string {
  return [normalizeWord(p[0]), normalizeWord(p[1])].sort().join('|');
}

/**
 * Choisit une paire dans les catégories demandées, au niveau demandé.
 * Si le niveau exact n'existe pas, élargit (±1 niveau puis tous).
 * Évite les paires jouées récemment tant que c'est possible.
 */
export function pickWordPair(
  categories: WordCategory[],
  difficulty: Difficulty,
  recentKeys: string[] = [],
  rng: Rng = secureRandom,
): PickedPair {
  const all = categories.flatMap((c) => c.pairs.map((p) => ({ p, c })));
  if (all.length === 0) throw new Error('Aucune paire de mots disponible.');
  const target = DIFFICULTY_LEVEL[difficulty];
  const recent = new Set(recentKeys);
  const tiers = [
    (lvl: number) => lvl === target,
    (lvl: number) => Math.abs(lvl - target) <= 1,
    () => true,
  ];
  let pool: typeof all = [];
  for (const tier of tiers) {
    const byLevel = all.filter(({ p }) => tier(p[2]));
    const fresh = byLevel.filter(({ p }) => !recent.has(pairKey(p)));
    if (fresh.length) {
      pool = fresh;
      break;
    }
    if (!pool.length && byLevel.length) pool = byLevel;
  }
  if (!pool.length) pool = all;
  const { p, c } = pool[Math.floor(rng() * pool.length)];
  const swap = rng() < 0.5;
  return {
    civilWord: swap ? p[1] : p[0],
    undercoverWord: swap ? p[0] : p[1],
    categoryId: c.id,
    categoryName: c.name,
    key: pairKey(p),
  };
}

/** Mode Surprise : 3 à 5 catégories au hasard. */
export function surpriseCategories(ids: string[], rng: Rng = secureRandom): string[] {
  const n = Math.min(ids.length, randInt(3, 5, rng));
  return shuffle(ids, rng).slice(0, n);
}
