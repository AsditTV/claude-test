import { describe, expect, it } from 'vitest';
import {
  assignRoles,
  buildSpeakingOrder,
  checkWinner,
  didRoleWin,
  isGuessCorrect,
  maxImpostors,
  pickWordPair,
  randomComposition,
  recommendComposition,
  tallyVotes,
  validateComposition,
} from './game';
import type { Role, WordCategory } from '../types';
import bank from '../data/words.json';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

describe('composition', () => {
  it('recommande une composition valide pour 3 à 20 joueurs', () => {
    for (let n = 3; n <= 20; n++) {
      for (const allow of [true, false]) {
        const c = recommendComposition(n, allow);
        expect(validateComposition(n, c.undercover, c.mrWhite)).toBeNull();
        expect(c.undercover).toBeGreaterThanOrEqual(1);
        expect(c.undercover + c.mrWhite + c.civils).toBe(n);
        if (!allow) expect(c.mrWhite).toBe(0);
      }
    }
  });

  it('génère des compositions aléatoires toujours valides', () => {
    for (let n = 3; n <= 20; n++) {
      for (let k = 0; k < 200; k++) {
        const c = randomComposition(n, k % 2 === 0);
        expect(validateComposition(n, c.undercover, c.mrWhite)).toBeNull();
        expect(c.undercover).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('refuse les compositions impossibles', () => {
    expect(validateComposition(2, 1, 0)).not.toBeNull();
    expect(validateComposition(21, 1, 0)).not.toBeNull();
    expect(validateComposition(5, 0, 0)).not.toBeNull();
    expect(validateComposition(4, 1, 1)).not.toBeNull(); // 2 civils vs 2 imposteurs
    expect(validateComposition(3, 1, 1)).not.toBeNull();
    expect(validateComposition(5, 1, 1)).toBeNull();
    expect(validateComposition(3, 0, 1)).toBeNull(); // Mr White seul est possible
    expect(maxImpostors(3)).toBe(1);
    expect(maxImpostors(20)).toBe(9);
  });
});

describe('attribution des rôles', () => {
  it('respecte exactement la composition', () => {
    const roles = assignRoles(ids(11), 3, 2);
    const vals = Object.values(roles);
    expect(vals.filter((r) => r === 'undercover')).toHaveLength(3);
    expect(vals.filter((r) => r === 'mrwhite')).toHaveLength(2);
    expect(vals.filter((r) => r === 'civil')).toHaveLength(6);
  });

  it('est réellement aléatoire (chaque joueur peut être undercover)', () => {
    const hits: Record<string, number> = {};
    for (let k = 0; k < 3000; k++) {
      const roles = assignRoles(ids(6), 1, 0);
      const u = Object.keys(roles).find((id) => roles[id] === 'undercover')!;
      hits[u] = (hits[u] ?? 0) + 1;
    }
    for (const id of ids(6)) expect(hits[id]).toBeGreaterThan(350); // ~500 attendu
  });

  it('lève une erreur si la composition est invalide', () => {
    expect(() => assignRoles(ids(4), 2, 0)).toThrow();
  });
});

describe('ordre de parole', () => {
  it('Mr White ne commence jamais', () => {
    const roles: Record<string, Role> = { a: 'mrwhite', b: 'civil', c: 'civil', d: 'undercover' };
    for (let k = 0; k < 200; k++) {
      const order = buildSpeakingOrder(['a', 'b', 'c', 'd'], roles, true);
      expect(order[0]).not.toBe('a');
      expect(new Set(order).size).toBe(4);
    }
    expect(buildSpeakingOrder(['a', 'b', 'c', 'd'], roles, false)).toEqual(['b', 'c', 'd', 'a']);
  });
});

describe('conditions de victoire', () => {
  it('civils gagnent sans imposteur', () => {
    expect(checkWinner(['civil', 'civil'])).toBe('civils');
  });
  it('la partie continue tant que les civils sont majoritaires', () => {
    expect(checkWinner(['civil', 'civil', 'undercover'])).toBeNull();
    expect(checkWinner(['civil', 'civil', 'civil', 'undercover', 'mrwhite'])).toBeNull();
  });
  it('undercover gagnent à égalité', () => {
    expect(checkWinner(['civil', 'undercover'])).toBe('undercover');
    expect(checkWinner(['civil', 'civil', 'undercover', 'undercover'])).toBe('undercover');
  });
  it('Mr White seul survivant face à un civil gagne', () => {
    expect(checkWinner(['civil', 'mrwhite'])).toBe('mrwhite');
  });
  it('victoire commune des imposteurs', () => {
    expect(checkWinner(['civil', 'civil', 'undercover', 'mrwhite'])).toBe('imposteurs');
  });
  it('didRoleWin', () => {
    expect(didRoleWin('mrwhite', 'imposteurs')).toBe(true);
    expect(didRoleWin('civil', 'imposteurs')).toBe(false);
    expect(didRoleWin('undercover', 'mrwhite')).toBe(false);
  });
});

describe('votes', () => {
  it('compte les voix et détecte une égalité', () => {
    const t = tallyVotes({ a: 'b', b: 'a', c: 'b', d: 'a' }, ['a', 'b', 'c', 'd']);
    expect(t.max).toBe(2);
    expect(t.leaders.sort()).toEqual(['a', 'b']);
  });
  it('ignore les votes hors candidats (second tour)', () => {
    const t = tallyVotes({ a: 'b', b: 'c', c: 'b' }, ['b', 'c']);
    expect(t.counts).toEqual({ b: 2, c: 1 });
    expect(t.leaders).toEqual(['b']);
  });
});

describe('devinette de Mr White', () => {
  it('tolère accents, casse, articles et petites fautes', () => {
    expect(isGuessCorrect('spiderman', 'Spider-Man')).toBe(true);
    expect(isGuessCorrect('  CRÊPE ', 'Crêpe')).toBe(true);
    expect(isGuessCorrect('la plage', 'Plage')).toBe(true);
    expect(isGuessCorrect('Telephonne', 'Téléphone')).toBe(true);
    expect(isGuessCorrect('chats', 'Chat')).toBe(true);
    expect(isGuessCorrect('lynx', 'Chat')).toBe(false);
    expect(isGuessCorrect('', 'Chat')).toBe(false);
    expect(isGuessCorrect('Thor', 'Tor')).toBe(false);
  });
});

describe('banque de mots', () => {
  const cats = (bank as unknown as { categories: WordCategory[] }).categories;
  it('contient des milliers de mots', () => {
    const words = new Set(cats.flatMap((c) => c.pairs.flatMap((p) => [p[0], p[1]])));
    expect(words.size).toBeGreaterThan(2000);
    expect(cats.length).toBeGreaterThanOrEqual(30);
  });
  it('chaque paire est valide', () => {
    for (const c of cats)
      for (const p of c.pairs) {
        expect(p[0].trim()).not.toBe('');
        expect(p[1].trim()).not.toBe('');
        expect(p[0].toLowerCase()).not.toBe(p[1].toLowerCase());
        expect([1, 2, 3]).toContain(p[2]);
      }
  });
  it('pickWordPair respecte la difficulté et évite les paires récentes', () => {
    const marvel = cats.filter((c) => c.id === 'marvel');
    for (const d of ['facile', 'normal', 'difficile'] as const) {
      const p = pickWordPair(marvel, d);
      expect(p.civilWord).not.toBe(p.undercoverWord);
      expect(p.categoryId).toBe('marvel');
    }
    const tiny: WordCategory[] = [
      { id: 't', name: 'T', emoji: '', pairs: [['A', 'B', 2], ['C', 'D', 2]] },
    ];
    for (let k = 0; k < 50; k++) {
      const p = pickWordPair(tiny, 'normal', ['a|b']);
      expect(['C', 'D']).toContain(p.civilWord);
    }
    // niveau absent → élargit sans planter
    expect(() => pickWordPair(tiny, 'facile')).not.toThrow();
  });
});
