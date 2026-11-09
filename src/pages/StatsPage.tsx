import { BarChart3, Crown } from 'lucide-react';
import { useMemo } from 'react';
import { Screen, TopBar } from '../components/layout';
import { ROLE_META, WINNER_META } from '../components/roles';
import { Avatar, Card } from '../components/ui';
import { useNav } from '../hooks/useNav';
import { computeStats, loadHistory } from '../utils/history';
import type { Role, Winner } from '../types';

export function StatsPage() {
  const { go } = useNav();
  const stats = useMemo(() => computeStats(loadHistory()), []);
  const teams: Winner[] = ['civils', 'undercover', 'mrwhite', 'imposteurs'];
  const maxTeam = Math.max(1, ...teams.map((t) => stats.winsByTeam[t]));

  return (
    <Screen className="pb-8">
      <TopBar title="Statistiques" onBack={() => go('home')} />
      {stats.games === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-500">
          <BarChart3 size={48} strokeWidth={1.5} />
          <p className="mt-4 font-display text-lg font-semibold text-slate-300">Pas encore de statistiques</p>
          <p className="mt-1 text-sm">Terminez une partie pour commencer le classement.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <p className="label">Victoires par camp · {stats.games} parties</p>
            <div className="space-y-2.5">
              {teams.map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-6 text-center text-lg">{WINNER_META[t].emoji}</span>
                  <span className="w-24 shrink-0 text-sm text-slate-300 capitalize">{t === 'mrwhite' ? 'Mr White' : t}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${WINNER_META[t].gradient}`}
                      style={{ width: `${(stats.winsByTeam[t] / maxTeam) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-display font-bold tabular-nums">{stats.winsByTeam[t]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="label">Classement des joueurs</p>
            <ul className="space-y-2">
              {stats.players.map((p, i) => (
                <li key={p.name} className="rounded-2xl bg-white/[0.04] p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-display text-sm font-bold text-slate-500">{i === 0 ? <Crown size={16} className="text-amber-300" /> : i + 1}</span>
                    <Avatar name={p.name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display font-semibold">{p.name}</span>
                      <span className="text-xs text-slate-500">
                        {p.games} partie(s) · {Math.round((p.wins / p.games) * 100)} % de victoires
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-xl font-bold">{p.wins}</span>
                      <span className="text-[10px] text-slate-500 uppercase">victoires</span>
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(['civil', 'undercover', 'mrwhite'] as Role[]).map((r) => (
                      <div key={r} className="rounded-xl bg-white/[0.04] px-2 py-1.5 text-center">
                        <div className={`text-[10px] font-semibold ${ROLE_META[r].text}`}>{ROLE_META[r].short}</div>
                        <div className="font-display text-sm font-bold">
                          {p.byRole[r].won}
                          <span className="text-slate-500">/{p.byRole[r].played}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                    <span>Éliminé en premier : {p.firstOut}×</span>
                    <span>Survivant : {p.survived}×</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </Screen>
  );
}
