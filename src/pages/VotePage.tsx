import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Dices, Gavel, Lock, Scale, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Screen, TopBar } from '../components/layout';
import { Avatar, Button, ConfirmModal } from '../components/ui';
import { useGame } from '../hooks/useGame';
import { tallyVotes, type Tally } from '../utils/game';
import { pick } from '../utils/random';

type Step = 'intro' | 'pass' | 'choose' | 'counting' | 'tally' | 'lot';

/** Vote secret, joueur par joueur, avec second tour en cas d'égalité puis tirage au sort. */
export function VotePage() {
  const { game, eliminate, backToDiscussion } = useGame();
  const g = game!;
  const alive = useMemo(() => {
    const byOrder = g.speakingOrder.filter((id) => g.players.find((p) => p.id === id)?.alive);
    const rest = g.players.filter((p) => p.alive && !byOrder.includes(p.id)).map((p) => p.id);
    return [...byOrder, ...rest];
  }, [g]);
  const name = (id: string) => g.players.find((p) => p.id === id)?.name ?? '?';

  const [step, setStep] = useState<Step>('intro');
  const [voteRound, setVoteRound] = useState<1 | 2>(1);
  const [candidates, setCandidates] = useState<string[]>(alive);
  const [voterIdx, setVoterIdx] = useState(0);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [target, setTarget] = useState<string | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);

  const voter = alive[voterIdx];

  const castVote = () => {
    if (!target) return;
    const next = { ...votes, [voter]: target };
    setVotes(next);
    setTarget(null);
    if (voterIdx + 1 < alive.length) {
      setVoterIdx(voterIdx + 1);
      setStep('pass');
    } else {
      setTally(tallyVotes(next, candidates));
      setStep('counting');
    }
  };

  useEffect(() => {
    if (step !== 'counting') return;
    const t = setTimeout(() => setStep('tally'), 1600);
    return () => clearTimeout(t);
  }, [step]);

  const startRevote = (tied: string[]) => {
    setCandidates(tied);
    setVotes({});
    setVoterIdx(0);
    setVoteRound(2);
    setTally(null);
    setStep('pass');
  };

  const sorted = tally ? [...candidates].sort((a, b) => tally.counts[b] - tally.counts[a]) : [];
  const isTie = !!tally && tally.leaders.length > 1;

  return (
    <Screen className="pb-6">
      <TopBar showQuit title={voteRound === 1 ? `Vote · Manche ${g.round}` : 'Second vote'} />

      <AnimatePresence mode="wait">
        <motion.section
          key={`${step}-${voterIdx}-${voteRound}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.28 }}
          className="flex flex-1 flex-col"
        >
          {step === 'intro' && (
            <>
              <Center>
                <Icon className="from-violet-500 to-blue-500">
                  <Lock size={40} />
                </Icon>
                <h1 className="font-display text-3xl font-black">Vote secret</h1>
                <p className="mt-3 max-w-xs text-slate-400">
                  Le téléphone passe de main en main. Chaque joueur vote <b className="text-slate-200">sans que les autres voient</b>.
                </p>
                <p className="mt-4 text-sm text-slate-500">{alive.length} votants</p>
              </Center>
              <div className="grid gap-2">
                <Button size="xl" block onClick={() => setStep('pass')} data-testid="vote-start">
                  COMMENCER LE VOTE
                </Button>
                <Button variant="ghost" size="md" icon={<ArrowLeft size={16} />} onClick={backToDiscussion}>
                  Retour au débat
                </Button>
              </div>
            </>
          )}

          {step === 'pass' && (
            <>
              <Center>
                {voteRound === 2 && voterIdx === 0 && (
                  <p className="mb-6 rounded-full bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
                    Second vote entre {candidates.map(name).join(', ')}
                  </p>
                )}
                <Avatar name={name(voter)} size={84} className="mb-5 ring-4 ring-white/10" />
                <p className="text-sm text-slate-400">
                  Vote {voterIdx + 1} / {alive.length} — passe le téléphone à
                </p>
                <h1 className="mt-1 max-w-full font-display text-5xl font-black break-words" data-testid="voter-name">
                  {name(voter)}
                </h1>
              </Center>
              <Button size="xl" block icon={<UserCheck size={22} />} onClick={() => setStep('choose')} guardMs={900} data-testid="i-am-voter">
                JE SUIS {name(voter).toUpperCase()}
              </Button>
            </>
          )}

          {step === 'choose' && (
            <div className="flex flex-1 flex-col pt-2">
              <div className="mb-5 text-center">
                <p className="text-sm text-slate-400">{name(voter)}, en ton âme et conscience…</p>
                <h1 className="font-display text-3xl font-black">Qui veux-tu éliminer ?</h1>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {candidates
                  .filter((c) => c !== voter)
                  .map((c) => (
                    <motion.button
                      key={c}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setTarget(c)}
                      data-testid={`vote-for-${name(c)}`}
                      className="glass flex flex-col items-center gap-2 rounded-2xl p-4 transition hover:bg-white/10"
                    >
                      <Avatar name={name(c)} size={52} />
                      <span className="w-full truncate font-display font-semibold">{name(c)}</span>
                    </motion.button>
                  ))}
              </div>
            </div>
          )}

          {step === 'counting' && (
            <Center>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                <Scale size={64} className="text-violet-300" />
              </motion.div>
              <h1 className="mt-6 font-display text-3xl font-black">Dépouillement…</h1>
            </Center>
          )}

          {step === 'tally' && tally && (
            <>
              <div className="pt-2">
                <h1 className="mb-1 text-center font-display text-3xl font-black">Résultats du vote</h1>
                <p className="mb-6 text-center text-sm text-slate-400">
                  {isTie ? 'Égalité !' : `${name(tally.leaders[0])} reçoit le plus de voix.`}
                </p>
                <div className="space-y-2.5">
                  {sorted.map((c, i) => {
                    const lead = tally.leaders.includes(c);
                    const pct = tally.max ? tally.counts[c] / Math.max(...Object.values(tally.counts), 1) : 0;
                    return (
                      <motion.div
                        key={c}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`relative overflow-hidden rounded-2xl p-3 ${lead ? 'bg-rose-500/10 ring-1 ring-rose-400/40' : 'bg-white/[0.04]'}`}
                      >
                        <motion.div
                          className={`absolute inset-y-0 left-0 ${lead ? 'bg-rose-500/20' : 'bg-white/5'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                        />
                        <div className="relative flex items-center gap-3">
                          <Avatar name={name(c)} size={34} />
                          <span className="flex-1 truncate font-medium">{name(c)}</span>
                          <span className="font-display text-xl font-bold tabular-nums">{tally.counts[c]}</span>
                          <span className="text-xs text-slate-500">voix</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-auto pt-8">
                {!isTie ? (
                  <Button
                    size="xl"
                    variant="danger"
                    block
                    icon={<Gavel size={22} />}
                    onClick={() => eliminate(tally.leaders[0], voteRound === 1 ? 'vote' : 'revote', tally.max)}
                    data-testid="confirm-elimination"
                  >
                    ÉLIMINER {name(tally.leaders[0]).toUpperCase()}
                  </Button>
                ) : voteRound === 1 ? (
                  <Button size="xl" block icon={<Scale size={22} />} onClick={() => startRevote(tally.leaders)} data-testid="revote">
                    SECOND VOTE
                  </Button>
                ) : (
                  <Button size="xl" block icon={<Dices size={22} />} onClick={() => setStep('lot')} data-testid="lot">
                    TIRAGE AU SORT
                  </Button>
                )}
              </div>
            </>
          )}

          {step === 'lot' && tally && <Lottery names={tally.leaders.map((id) => ({ id, name: name(id) }))} onDone={(id) => eliminate(id, 'lot')} />}
        </motion.section>
      </AnimatePresence>

      <ConfirmModal
        open={!!target}
        onCancel={() => setTarget(null)}
        onConfirm={castVote}
        title="Confirmer ton vote"
        confirmLabel="Je vote"
        variant="danger"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          {target && <Avatar name={name(target)} size={40} />}
          <span>
            Tu votes contre <b className="text-white">{target ? name(target) : ''}</b>. Ce choix est définitif.
          </span>
        </div>
      </ConfirmModal>
    </Screen>
  );
}

function Lottery({ names: initial, onDone }: { names: { id: string; name: string }[]; onDone: (id: string) => void }) {
  const [names] = useState(initial); // figé : la roulette ne doit pas redémarrer à chaque rendu
  const [idx, setIdx] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  useEffect(() => {
    const chosen = pick(names).id;
    let i = 0;
    let delay = 70;
    let t: ReturnType<typeof setTimeout>;
    const spin = () => {
      i++;
      setIdx(i % names.length);
      delay *= 1.12;
      if (delay > 420 && names[i % names.length].id === chosen) {
        setWinner(chosen);
        return;
      }
      t = setTimeout(spin, delay);
    };
    t = setTimeout(spin, delay);
    return () => clearTimeout(t);
  }, [names]);
  const current = names[idx];
  return (
    <>
      <Center>
        <p className="mb-6 text-slate-400">Nouvelle égalité… le sort décide !</p>
        <motion.div key={current.id} initial={{ scale: 0.8, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
          <Avatar name={current.name} size={96} className={winner ? 'ring-4 ring-rose-400' : ''} />
          <h1 className="mt-4 font-display text-4xl font-black">{current.name}</h1>
        </motion.div>
      </Center>
      <Button size="xl" variant="danger" block disabled={!winner} onClick={() => winner && onDone(winner)} data-testid="lot-confirm">
        {winner ? 'ÉLIMINER' : 'Tirage en cours…'}
      </Button>
    </>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">{children}</div>;
}

function Icon({ children, className }: { children: React.ReactNode; className: string }) {
  return <div className={`mb-6 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br shadow-2xl ${className}`}>{children}</div>;
}
