import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EliminationMethod, GameSettings, GameState, HistoryEntry, Winner } from '../types';
import { builtInCategories, customCategory, CUSTOM_CATEGORY_ID } from '../data/words';
import { assignRoles, checkWinner, didRoleWin, pickWordPair, surpriseCategories } from '../utils/game';
import { shuffle, uid } from '../utils/random';
import {
  anonymousRoles,
  checkMrWhiteGuess,
  clearSecret,
  restoreSecret,
  revealAll,
  revealEliminatedRole,
  sealSecret,
  speakingOrder,
} from '../utils/secretVault';
import { KEYS, readJSON, removeKey, writeJSON } from '../utils/storage';
import { resolveNames, saveSettings } from '../utils/settings';
import { addHistory } from '../utils/history';

interface GameApi {
  game: GameState | null;
  startGame: (settings: GameSettings) => void;
  replay: (shufflePlayers?: boolean) => void;
  nextDistribution: () => void;
  startDiscussion: () => void;
  goToVote: () => void;
  backToDiscussion: () => void;
  eliminate: (playerId: string, method: EliminationMethod, votes?: number) => void;
  afterReveal: () => void;
  submitGuess: (guess: string) => boolean;
  continueAfterGuess: () => void;
  quitGame: () => void;
}

const GameContext = createContext<GameApi | null>(null);

function loadSavedGame(): GameState | null {
  const g = readJSON<GameState | null>(KEYS.game, null, 'session');
  if (g && restoreSecret()) return g;
  return null;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState | null>(loadSavedGame);

  // Persistance de l'état PUBLIC (le secret est géré par le coffre).
  useEffect(() => {
    if (game) writeJSON(KEYS.game, game, 'session');
    else removeKey(KEYS.game, 'session');
  }, [game]);

  const startGame = useCallback((settings: GameSettings) => {
    const names = resolveNames(settings.playerNames);
    const players = names.map((name) => ({ id: uid(), name, alive: true }));
    const roles = assignRoles(
      players.map((p) => p.id),
      settings.undercoverCount,
      settings.mrWhiteCount,
    );

    // Catégories
    const custom = customCategory();
    const pool = [...builtInCategories, ...(custom.pairs.length ? [custom] : [])];
    let ids = settings.categoryIds.length ? settings.categoryIds : builtInCategories.map((c) => c.id);
    if (settings.surprise) ids = surpriseCategories(builtInCategories.map((c) => c.id));
    if (settings.includeCustom && custom.pairs.length && !ids.includes(CUSTOM_CATEGORY_ID)) ids = [...ids, CUSTOM_CATEGORY_ID];
    let cats = pool.filter((c) => ids.includes(c.id) && c.pairs.length);
    if (!cats.length) cats = builtInCategories;

    const recent = readJSON<string[]>(KEYS.recent, []);
    const pair = pickWordPair(cats, settings.difficulty, recent);
    writeJSON(KEYS.recent, [pair.key, ...recent].slice(0, 300));

    sealSecret({
      roles,
      civilWord: pair.civilWord,
      undercoverWord: pair.undercoverWord,
      categoryId: pair.categoryId,
      categoryName: pair.categoryName,
    });
    saveSettings(settings);

    setGame({
      id: uid(),
      settings,
      players,
      distributionIndex: 0,
      speakingOrder: [],
      round: 1,
      phase: 'distribution',
      eliminations: [],
      winner: null,
      startedAt: Date.now(),
      publicCategoryLabel: settings.surprise
        ? 'Surprise'
        : cats.length === 1
          ? cats[0].name
          : `${cats.length} catégories`,
    });
  }, []);

  const replay = useCallback(
    (shufflePlayers = false) => {
      if (!game) return;
      const s = game.settings;
      startGame({ ...s, playerNames: shufflePlayers ? shuffle(resolveNames(s.playerNames)) : s.playerNames });
    },
    [game, startGame],
  );

  const newRound = (g: GameState, round: number): GameState => {
    const alive = g.players.filter((p) => p.alive).map((p) => p.id);
    return { ...g, round, phase: 'discussion', speakingOrder: speakingOrder(alive, g.settings.options.randomOrder) };
  };

  const nextDistribution = useCallback(() => {
    setGame((g) => {
      if (!g) return g;
      const idx = g.distributionIndex + 1;
      if (idx < g.players.length) return { ...g, distributionIndex: idx };
      return { ...g, distributionIndex: idx };
    });
  }, []);

  const startDiscussion = useCallback(() => {
    setGame((g) => {
      if (!g) return g;
      if (g.phase === 'distribution' && g.settings.options.showRules) return { ...g, phase: 'rules' };
      return newRound(g, g.round);
    });
  }, []);

  const goToVote = useCallback(() => setGame((g) => (g ? { ...g, phase: 'vote' } : g)), []);
  const backToDiscussion = useCallback(() => setGame((g) => (g ? { ...g, phase: 'discussion' } : g)), []);

  const finish = (g: GameState, winner: Winner): GameState => {
    const ended: GameState = { ...g, winner, phase: 'results', endedAt: Date.now() };
    const secret = revealAll();
    const rank = new Map(g.eliminations.map((e, i) => [e.playerId, i + 1]));
    const entry: HistoryEntry = {
      id: g.id,
      name: g.settings.gameName.trim() || 'Partie sans nom',
      date: g.startedAt,
      durationSec: Math.round((Date.now() - g.startedAt) / 1000),
      winner,
      civilWord: secret.civilWord,
      undercoverWord: secret.undercoverWord,
      categoryName: secret.categoryName,
      difficulty: g.settings.difficulty,
      mode: g.settings.mode,
      rounds: g.round,
      players: g.players.map((p) => ({
        name: p.name,
        role: secret.roles[p.id],
        won: didRoleWin(secret.roles[p.id], winner),
        eliminatedRank: rank.get(p.id) ?? null,
      })),
    };
    addHistory(entry);
    return ended;
  };

  const eliminate = useCallback((playerId: string, method: EliminationMethod, votes?: number) => {
    setGame((g) => {
      if (!g) return g;
      const role = revealEliminatedRole(playerId);
      return {
        ...g,
        players: g.players.map((p) => (p.id === playerId ? { ...p, alive: false } : p)),
        eliminations: [...g.eliminations, { playerId, round: g.round, role, method, votes }],
        phase: 'reveal',
      };
    });
  }, []);

  const resolveOrContinue = (g: GameState): GameState => {
    const alive = g.players.filter((p) => p.alive).map((p) => p.id);
    const winner = checkWinner(anonymousRoles(alive));
    return winner ? finish(g, winner) : newRound(g, g.round + 1);
  };

  const afterReveal = useCallback(() => {
    setGame((g) => {
      if (!g) return g;
      const last = g.eliminations[g.eliminations.length - 1];
      if (last?.role === 'mrwhite' && last.mrWhiteGuess === undefined) return { ...g, phase: 'mrwhite-guess' };
      return resolveOrContinue(g);
    });
  }, []);

  const submitGuess = useCallback(
    (guess: string) => {
      const correct = checkMrWhiteGuess(guess);
      setGame((g) => {
        if (!g) return g;
        const elims = g.eliminations.slice();
        elims[elims.length - 1] = { ...elims[elims.length - 1], mrWhiteGuess: guess.trim(), guessCorrect: correct };
        return { ...g, eliminations: elims };
      });
      return correct;
    },
    [],
  );

  const continueAfterGuess = useCallback(() => {
    setGame((g) => {
      if (!g) return g;
      const last = g.eliminations[g.eliminations.length - 1];
      if (last?.guessCorrect) return finish(g, 'mrwhite');
      return resolveOrContinue(g);
    });
  }, []);

  const quitGame = useCallback(() => {
    clearSecret();
    setGame(null);
  }, []);

  const api = useMemo<GameApi>(
    () => ({
      game,
      startGame,
      replay,
      nextDistribution,
      startDiscussion,
      goToVote,
      backToDiscussion,
      eliminate,
      afterReveal,
      submitGuess,
      continueAfterGuess,
      quitGame,
    }),
    [game, startGame, replay, nextDistribution, startDiscussion, goToVote, backToDiscussion, eliminate, afterReveal, submitGuess, continueAfterGuess, quitGame],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>');
  return ctx;
}
