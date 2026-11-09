import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Gavel, Mic, Pause, Play, RotateCcw, Skull, Vote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Screen, TopBar } from '../components/layout';
import { RolePill } from '../components/roles';
import { Avatar, Button, Card, ConfirmModal, Modal } from '../components/ui';
import { useGame } from '../hooks/useGame';

/** Phase de discussion : tour de parole guidé, puis passage au vote. */
export function GamePage() {
  const { game, goToVote, eliminate } = useGame();
  const g = game!;
  const order = g.speakingOrder.map((id) => g.players.find((p) => p.id === id)!).filter((p) => p?.alive);
  const [current, setCurrent] = useState(0);
  const allSpoke = current >= order.length;
  const timer = g.settings.options.speakingTimer;
  const [directPick, setDirectPick] = useState<string | null>(null);
  const [showDirect, setShowDirect] = useState(false);

  useEffect(() => setCurrent(0), [g.round]);

  const speaker = order[current];
  const eliminated = g.eliminations.map((e) => ({ e, p: g.players.find((p) => p.id === e.playerId)! }));

  return (
    <Screen
      footer={
        <div className="space-y-2">
          {!allSpoke ? (
            <Button size="xl" block icon={<ChevronRight size={22} />} onClick={() => setCurrent((c) => c + 1)} data-testid="next-speaker">
              {current === order.length - 1 ? 'DERNIER INDICE DONNÉ' : 'INDICE SUIVANT'}
            </Button>
          ) : g.settings.options.votesEnabled ? (
            <Button size="xl" block icon={<Vote size={22} />} onClick={goToVote} data-testid="go-vote">
              PASSER AU VOTE
            </Button>
          ) : (
            <Button size="xl" block icon={<Gavel size={22} />} onClick={() => setShowDirect(true)} data-testid="go-direct">
              DÉSIGNER L’ÉLIMINÉ
            </Button>
          )}
          {!allSpoke && (
            <Button variant="ghost" size="md" block onClick={() => setCurrent(order.length)} data-testid="skip-turns">
              Passer directement {g.settings.options.votesEnabled ? 'au vote' : 'à l’élimination'}
            </Button>
          )}
        </div>
      }
    >
      <TopBar showQuit title={`Manche ${g.round}`} />

      <div className="mb-4 flex items-center justify-center gap-2 text-xs text-slate-400">
        <span className="rounded-full bg-white/5 px-3 py-1">{g.players.filter((p) => p.alive).length} en jeu</span>
        <span className="rounded-full bg-white/5 px-3 py-1">{g.publicCategoryLabel}</span>
      </div>

      {/* Orateur courant */}
      <AnimatePresence mode="wait">
        <motion.div
          key={allSpoke ? 'done' : speaker?.id}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass relative mb-5 overflow-hidden rounded-[2rem] p-6 text-center"
        >
          <div className="absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
          {!allSpoke && speaker ? (
            <div className="relative">
              <p className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.25em] text-violet-300 uppercase">
                <Mic size={14} /> À toi de parler
              </p>
              <Avatar name={speaker.name} size={76} className="mx-auto ring-4 ring-violet-400/30" />
              <h2 className="mt-3 font-display text-4xl font-black break-words" data-testid="speaker-name">
                {speaker.name}
              </h2>
              <p className="mt-1 text-sm text-slate-400">Donne un indice sur ton mot</p>
              {timer > 0 && <SpeakTimer key={`${g.round}-${current}`} seconds={timer} />}
            </div>
          ) : (
            <div className="relative py-4">
              <p className="text-5xl">🗳️</p>
              <h2 className="mt-3 font-display text-2xl font-black">Tout le monde a parlé</h2>
              <p className="mt-1 text-sm text-slate-400">Débattez, puis {g.settings.options.votesEnabled ? 'votez' : 'désignez un suspect'} !</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Ordre de passage */}
      <Card className="mb-4">
        <p className="label">Ordre de passage</p>
        <ol className="space-y-1.5">
          {order.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                i === current ? 'bg-violet-500/15 ring-1 ring-violet-400/40' : i < current ? 'opacity-45' : ''
              }`}
            >
              <span className="w-5 text-center font-display text-sm font-bold text-slate-500">{i + 1}</span>
              <Avatar name={p.name} size={30} />
              <span className="flex-1 truncate font-medium">{p.name}</span>
              {i < current && <span className="text-xs text-emerald-400">✓</span>}
              {i === current && <Mic size={14} className="text-violet-300" />}
            </li>
          ))}
        </ol>
        {allSpoke && (
          <button
            type="button"
            onClick={() => setCurrent(0)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"
          >
            <RotateCcw size={12} /> Refaire un tour d’indices
          </button>
        )}
      </Card>

      {eliminated.length > 0 && (
        <Card className="mb-2">
          <p className="label">Éliminés</p>
          <ul className="space-y-1.5">
            {eliminated.map(({ e, p }) => (
              <li key={p.id} className="flex items-center gap-3 px-1 py-1">
                <Skull size={16} className="text-slate-600" />
                <span className="flex-1 truncate text-slate-400 line-through decoration-slate-600">{p.name}</span>
                <RolePill role={e.role} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Élimination à main levée (votes désactivés) */}
      <Modal open={showDirect && !directPick} onClose={() => setShowDirect(false)} title="Qui est éliminé ?">
        <p className="mb-3 text-sm text-slate-300">Votez à main levée, puis touchez le joueur désigné.</p>
        <div className="grid grid-cols-2 gap-2">
          {g.players
            .filter((p) => p.alive)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDirectPick(p.id)}
                data-testid={`direct-${p.name}`}
                className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5 text-left hover:bg-white/10"
              >
                <Avatar name={p.name} size={28} />
                <span className="truncate text-sm font-medium text-white">{p.name}</span>
              </button>
            ))}
        </div>
      </Modal>
      <ConfirmModal
        open={!!directPick}
        onCancel={() => setDirectPick(null)}
        onConfirm={() => {
          const id = directPick!;
          setDirectPick(null);
          setShowDirect(false);
          eliminate(id, 'direct');
        }}
        title={`Éliminer ${g.players.find((p) => p.id === directPick)?.name ?? ''} ?`}
        confirmLabel="Éliminer"
        variant="danger"
      >
        Son rôle sera révélé à tout le monde.
      </ConfirmModal>
    </Screen>
  );
}

function SpeakTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, running]);
  useEffect(() => {
    if (left === 0) navigator.vibrate?.([80, 60, 80]);
  }, [left]);
  const pct = left / seconds;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={r} stroke="rgba(255,255,255,.1)" strokeWidth="5" fill="none" />
          <circle
            cx="32"
            cy="32"
            r={r}
            stroke={left <= 5 ? '#f43f5e' : '#a78bfa'}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
          />
        </svg>
        <span className={`absolute inset-0 grid place-items-center font-display text-lg font-bold ${left <= 5 ? 'text-rose-400' : ''}`}>
          {left}
        </span>
      </div>
      <button
        type="button"
        aria-label={running ? 'Pause' : 'Reprendre'}
        onClick={() => (left === 0 ? (setLeft(seconds), setRunning(true)) : setRunning((r) => !r))}
        className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-slate-300 hover:bg-white/10"
      >
        {left === 0 ? <RotateCcw size={16} /> : running ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </div>
  );
}
