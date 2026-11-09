// ─────────────────────────────────────────────────────────────
// Types partagés.
// Règle d'or : tout ce qui est SECRET (rôles, mots) vit dans
// `SecretData` et n'est manipulé que par `utils/secretVault.ts`.
// L'état PUBLIC (`GameState`) ne contient jamais de mot ni le rôle
// d'un joueur encore en vie.
// ─────────────────────────────────────────────────────────────

export type Role = 'civil' | 'undercover' | 'mrwhite';

export type Difficulty = 'facile' | 'normal' | 'difficile';

/** 1 = facile, 2 = normal, 3 = difficile */
export type PairLevel = 1 | 2 | 3;

/** [mot A, mot B, niveau] — l'ordre A/B est tiré au sort à chaque partie. */
export type WordPairTuple = [string, string, PairLevel];

export interface WordCategory {
  id: string;
  name: string;
  emoji: string;
  pairs: WordPairTuple[];
}

export interface WordBank {
  version: number;
  categories: WordCategory[];
}

export type GameMode = 'classique' | 'rapide' | 'sans-mrwhite' | 'perso';

export interface GameOptions {
  /** Les joueurs votent un par un sur le téléphone. Sinon : élimination à main levée. */
  votesEnabled: boolean;
  /** Mr White reçoit la catégorie comme indice. */
  cluesEnabled: boolean;
  /** Ordre de passage aléatoire à chaque manche. */
  randomOrder: boolean;
  /** Secondes par indice (0 = pas de chrono). */
  speakingTimer: number;
  /** Variante officielle : civils et undercover voient seulement leur mot, pas leur rôle. */
  hiddenRoles: boolean;
  /** Afficher l'écran des règles avant la première manche. */
  showRules: boolean;
}

export interface GameSettings {
  gameName: string;
  playerNames: string[];
  undercoverCount: number;
  mrWhiteCount: number;
  categoryIds: string[];
  surprise: boolean;
  difficulty: Difficulty;
  mode: GameMode;
  includeCustom: boolean;
  options: GameOptions;
}

// ── Données PUBLIQUES ──────────────────────────────────────────

export interface PublicPlayer {
  id: string;
  name: string;
  alive: boolean;
}

export type EliminationMethod = 'vote' | 'revote' | 'lot' | 'direct';

export interface Elimination {
  playerId: string;
  round: number;
  /** Révélé publiquement au moment de l'élimination. */
  role: Role;
  method: EliminationMethod;
  votes?: number;
  mrWhiteGuess?: string;
  guessCorrect?: boolean;
}

export type Winner = 'civils' | 'undercover' | 'mrwhite' | 'imposteurs';

export type Phase =
  | 'distribution'
  | 'rules'
  | 'discussion'
  | 'vote'
  | 'reveal'
  | 'mrwhite-guess'
  | 'results';

export interface GameState {
  id: string;
  settings: GameSettings;
  players: PublicPlayer[];
  /** Index du joueur qui découvre son rôle. */
  distributionIndex: number;
  speakingOrder: string[];
  round: number;
  phase: Phase;
  eliminations: Elimination[];
  winner: Winner | null;
  startedAt: number;
  endedAt?: number;
  /** Libellé public de la catégorie (masqué si mode Surprise). */
  publicCategoryLabel: string;
}

// ── Données SECRÈTES ───────────────────────────────────────────

export interface SecretData {
  roles: Record<string, Role>;
  civilWord: string;
  undercoverWord: string;
  categoryId: string;
  categoryName: string;
}

/** Ce qu'un joueur voit sur SA carte, et rien d'autre. */
export interface RoleCard {
  role: Role;
  /** Rôle affiché à l'écran (peut être masqué en mode « rôles cachés »). */
  displayedRole: Role | 'agent';
  word: string | null;
  hint: string | null;
}

// ── Historique ────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  name: string;
  date: number;
  durationSec: number;
  winner: Winner;
  civilWord: string;
  undercoverWord: string;
  categoryName: string;
  difficulty: Difficulty;
  mode: GameMode;
  players: { name: string; role: Role; won: boolean; eliminatedRank: number | null }[];
  rounds: number;
}

export interface CustomPair {
  id: string;
  a: string;
  b: string;
  level: PairLevel;
}
