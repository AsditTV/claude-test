// ─────────────────────────────────────────────────────────────
// Coffre-fort des informations secrètes.
//
// • Les rôles et les mots ne sortent d'ici que par des fonctions
//   ciblées : la carte d'UN joueur, le rôle d'un joueur ÉLIMINÉ,
//   la vérification de la devinette de Mr White, et le dévoilement
//   complet en fin de partie.
// • Jamais dans l'URL, jamais dans l'état React public.
// • Persisté en sessionStorage (pour survivre à un rafraîchissement
//   accidentel) sous forme encodée : pas de la cryptographie, juste
//   pour qu'aucun mot ne soit lisible en clair d'un coup d'œil.
// ─────────────────────────────────────────────────────────────
import type { GameOptions, Role, RoleCard, SecretData } from '../types';
import { buildSpeakingOrder, isGuessCorrect } from './game';
import { KEYS, readRaw, removeKey, writeRaw } from './storage';

let secret: SecretData | null = null;

function encode(s: SecretData): string {
  const json = JSON.stringify(s);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return b64.split('').reverse().join('');
}

function decode(raw: string): SecretData | null {
  try {
    const b64 = raw.split('').reverse().join('');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as SecretData;
  } catch {
    return null;
  }
}

export function sealSecret(s: SecretData): void {
  secret = s;
  writeRaw(KEYS.vault, encode(s), 'session');
}

export function restoreSecret(): boolean {
  const raw = readRaw(KEYS.vault, 'session');
  secret = raw ? decode(raw) : null;
  return secret !== null;
}

export function clearSecret(): void {
  secret = null;
  removeKey(KEYS.vault, 'session');
}

function must(): SecretData {
  if (!secret) throw new Error('Aucune partie en cours.');
  return secret;
}

/** La carte d'UN joueur : son rôle (éventuellement masqué) et son mot. */
export function getRoleCard(playerId: string, options: GameOptions): RoleCard {
  const s = must();
  const role = s.roles[playerId];
  const word = role === 'civil' ? s.civilWord : role === 'undercover' ? s.undercoverWord : null;
  const displayedRole = options.hiddenRoles && role !== 'mrwhite' ? 'agent' : role;
  const hint = role === 'mrwhite' && options.cluesEnabled ? s.categoryName : null;
  return { role, displayedRole, word, hint };
}

/** Rôle d'un joueur au moment où il est éliminé (information devenue publique). */
export function revealEliminatedRole(playerId: string): Role {
  return must().roles[playerId];
}

/** Rôles des survivants, anonymisés : sert uniquement au calcul de victoire. */
export function anonymousRoles(aliveIds: string[]): Role[] {
  const s = must();
  return aliveIds.map((id) => s.roles[id]);
}

export function speakingOrder(aliveIds: string[], random: boolean): string[] {
  return buildSpeakingOrder(aliveIds, must().roles, random);
}

export function checkMrWhiteGuess(guess: string): boolean {
  return isGuessCorrect(guess, must().civilWord);
}

/** Dévoilement complet : réservé à l'écran de résultats. */
export function revealAll(): SecretData {
  return must();
}
