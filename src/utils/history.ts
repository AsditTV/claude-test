import type { HistoryEntry, Role, Winner } from '../types';
import { KEYS, readJSON, writeJSON } from './storage';

const MAX_HISTORY = 200;

export function loadHistory(): HistoryEntry[] {
  return readJSON<HistoryEntry[]>(KEYS.history, []);
}

export function addHistory(entry: HistoryEntry): void {
  const h = loadHistory();
  if (h.some((e) => e.id === entry.id)) return; // jamais deux fois la même partie
  writeJSON(KEYS.history, [entry, ...h].slice(0, MAX_HISTORY));
}

export function clearHistory(): void {
  writeJSON(KEYS.history, []);
}

export interface PlayerStats {
  name: string;
  games: number;
  wins: number;
  byRole: Record<Role, { played: number; won: number }>;
  firstOut: number;
  survived: number;
}

export interface GlobalStats {
  games: number;
  winsByTeam: Record<Winner, number>;
  players: PlayerStats[];
}

export function computeStats(history: HistoryEntry[]): GlobalStats {
  const winsByTeam: Record<Winner, number> = { civils: 0, undercover: 0, mrwhite: 0, imposteurs: 0 };
  const map = new Map<string, PlayerStats>();
  for (const g of history) {
    winsByTeam[g.winner]++;
    for (const p of g.players) {
      const key = p.name.trim().toLowerCase();
      let s = map.get(key);
      if (!s) {
        s = {
          name: p.name,
          games: 0,
          wins: 0,
          firstOut: 0,
          survived: 0,
          byRole: {
            civil: { played: 0, won: 0 },
            undercover: { played: 0, won: 0 },
            mrwhite: { played: 0, won: 0 },
          },
        };
        map.set(key, s);
      }
      s.games++;
      s.byRole[p.role].played++;
      if (p.won) {
        s.wins++;
        s.byRole[p.role].won++;
      }
      if (p.eliminatedRank === 1) s.firstOut++;
      if (p.eliminatedRank === null) s.survived++;
    }
  }
  const players = [...map.values()].sort((a, b) => b.wins - a.wins || b.games - a.games);
  return { games: history.length, winsByTeam, players };
}
