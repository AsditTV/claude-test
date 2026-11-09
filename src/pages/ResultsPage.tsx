import { motion } from 'framer-motion';
import { Crown, Home, RotateCcw, Settings2, Shuffle, Skull, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { Confetti } from '../components/Confetti';
import { Screen, TopBar } from '../components/layout';
import { RolePill, ROLE_META, WINNER_META } from '../components/roles';
import { Avatar, Button, Card } from '../components/ui';
import { useGame } from '../hooks/useGame';
import { useNav } from '../hooks/useNav';
import { didRoleWin } from '../utils/game';
import { revealAll } from '../utils/secretVault';

export function ResultsPage() {
  const { game, replay, quitGame } = useGame();
  const { go } = useNav();
  const g = game!;
  // Écran de fin : seul endroit où l'on dévoile TOUT.
  const secret = useMemo(() => revealAll(), []);
  if (!g.winner) return null;
  const winner = g.winner;
  const w = WINNER_META[winner];
  const rank = new Map(g.eliminations.map((e, i) => [e.playerId, i + 1]));
  const players = [...g.players].sort((a, b) => {
    const wa = didRoleWin(secret.roles[a.id], winner) ? 0 : 1;
    const wb = didRoleWin(secret.roles[b.id], winner) ? 0 : 1;
    return wa - wb || (rank.get(b.id) ?? 99) - (rank.get(a.id) ?? 99);
  });
  const duration = Math.max(1, Math.round(((g.endedAt ?? Date.now()) - g.startedAt) / 60000));

  return (
    <Screen
      footer={
        <div className="grid gap-2">
          <Button size="xl" block icon={<RotateCcw size={20} />} onClick={() => replay(false)} data-testid="replay">
            REJOUER (MÊMES JOUEURS)
          </Button>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="md" icon={<Shuffle size={16} />} onClick={() => replay(true)}>
              Mélanger
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Settings2 size={16} />}
              onClick={() => {
                quitGame();
                go('setup');
              }}
            >
              Modifier
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Home size={16} />}
              onClick={() => {
                quitGame();
                go('home');
              }}
            >
              Accueil
            </Button>
          </div>
        </div>
      }
    >
      <Confetti />
      <TopBar title={g.settings.gameName || 'Fin de partie'} />

      {/* Bannière */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 13 }}
        className="relative mb-5 overflow-hidden rounded-[2rem] p-7 text-center"
        data-testid="winner-banner"
      >
        <div className={`absolute inset-0 bg-gradient-to-br opacity-90 ${w.gradient}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.35),transparent_60%)]" />
        <div className="relative">
          <motion.div
            initial={{ y: -20, rotate: -20 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-6xl drop-shadow-lg"
          >
            {w.emoji}
          </motion.div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold tracking-[0.3em] text-black/60 uppercase">
            <Trophy size={14} /> Victoire
          </p>
          <h1 className="font-display text-3xl leading-tight font-black text-white drop-shadow sm:text-4xl" data-testid="winner-title">
            {w.title}
          </h1>
          <p className="mt-2 text-sm font-medium text-white/85">{w.subtitle}</p>
        </div>
      </motion.div>

      {/* Mots */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <WordCard label="Mot des civils" word={secret.civilWord} className="from-sky-500/25 to-blue-600/10 ring-sky-400/30" testId="civil-word" />
        <WordCard label="Mot undercover" word={secret.undercoverWord} className="from-rose-500/25 to-fuchsia-600/10 ring-rose-400/30" testId="undercover-word" />
      </div>
      <p className="mb-4 text-center text-xs text-slate-500">
        {secret.categoryName} · {g.round} manche{g.round > 1 ? 's' : ''} · {duration} min
      </p>

      {/* Rôles */}
      <Card className="mb-4">
        <p className="label">Rôles des joueurs</p>
        <ul className="space-y-1.5">
          {players.map((p, i) => {
            const role = secret.roles[p.id];
            const won = didRoleWin(role, winner);
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl px-2 py-2 ${won ? 'bg-white/[0.05]' : ''}`}
              >
                <Avatar name={p.name} size={34} dim={!p.alive} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate font-medium">
                    {p.name} {won && <Crown size={14} className="shrink-0 text-amber-300" />}
                  </span>
                  <span className="text-xs text-slate-500">{p.alive ? 'Survivant' : `Éliminé en ${rank.get(p.id)}${rank.get(p.id) === 1 ? 'er' : 'e'}`}</span>
                </span>
                <RolePill role={role} />
              </motion.li>
            );
          })}
        </ul>
      </Card>

      {/* Classement des éliminations */}
      {g.eliminations.length > 0 && (
        <Card className="mb-2">
          <p className="label">Ordre des éliminations</p>
          <ol className="relative space-y-3 border-l border-white/10 pl-5">
            {g.eliminations.map((e, i) => {
              const p = g.players.find((x) => x.id === e.playerId)!;
              return (
                <li key={e.playerId} className="relative">
                  <span className={`absolute top-1 -left-[27px] grid h-3.5 w-3.5 place-items-center rounded-full bg-gradient-to-br ${ROLE_META[e.role].gradient}`} />
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-slate-500">#{i + 1}</span>
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    <RolePill role={e.role} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Manche {e.round} ·{' '}
                    {e.method === 'lot' ? 'tirage au sort' : e.method === 'direct' ? 'main levée' : `${e.votes} voix${e.method === 'revote' ? ' (2nd tour)' : ''}`}
                    {e.mrWhiteGuess !== undefined && (
                      <>
                        {' '}
                        · a proposé « {e.mrWhiteGuess} » {e.guessCorrect ? '✅' : '❌'}
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
          {g.players.some((p) => p.alive) && (
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Skull size={12} /> Survivants : {g.players.filter((p) => p.alive).map((p) => p.name).join(', ')}
            </p>
          )}
        </Card>
      )}
    </Screen>
  );
}

function WordCard({ label, word, className, testId }: { label: string; word: string; className: string; testId: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br p-4 text-center ring-1 ${className}`}>
      <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">{label}</p>
      <p className="mt-1 font-display text-xl leading-tight font-extrabold break-words text-white" data-testid={testId}>
        {word}
      </p>
    </div>
  );
}
