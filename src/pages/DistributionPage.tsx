import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, EyeOff, Hand, PartyPopper, Smartphone } from 'lucide-react';
import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { Screen, TopBar } from '../components/layout';
import { RoleFlipCard } from '../components/RoleFlipCard';
import { Avatar, Button, HoldButton } from '../components/ui';
import { useGame } from '../hooks/useGame';
import { getRoleCard } from '../utils/secretVault';
import type { RoleCard } from '../types';

type Step = 'intro' | 'turn' | 'revealed' | 'pass' | 'done';

export function DistributionPage() {
  const { game, nextDistribution, startDiscussion } = useGame();
  const g = game!;
  const n = g.players.length;
  const idx = g.distributionIndex;
  const [step, setStep] = useState<Step>(() => (idx >= n ? 'done' : idx === 0 ? 'intro' : 'turn'));
  const [flipped, setFlipped] = useState(false);
  const [card, setCard] = useState<RoleCard | null>(null);
  const [canFinish, setCanFinish] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = g.players[Math.min(idx, n - 1)];
  const nextPlayer = g.players[idx]; // après incrément, idx pointe le suivant

  useEffect(() => () => void (hideTimer.current && clearTimeout(hideTimer.current)), []);

  const reveal = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setCard(getRoleCard(player.id, g.settings.options));
    if (step === 'turn') {
      // On laisse la transition se terminer pour que le retournement soit visible.
      setStep('revealed');
      setFlipped(false);
      setTimeout(() => setFlipped(true), 380);
      setTimeout(() => setCanFinish(true), 1300);
    } else {
      setFlipped(true);
    }
  };

  const hide = () => {
    setFlipped(false);
    // Le contenu secret est retiré du DOM une fois la carte retournée.
    hideTimer.current = setTimeout(() => setCard(null), 450);
  };

  const finish = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setCard(null);
    setFlipped(false);
    setCanFinish(false);
    nextDistribution();
    setStep(idx + 1 >= n ? 'done' : 'pass');
  };

  return (
    <Screen className="pb-6">
      <TopBar
        showQuit
        title={
          step === 'done' || step === 'intro' ? 'Distribution des rôles' : `Joueur ${Math.min(idx + 1, n)} / ${n}`
        }
      />
      <Progress total={n} done={step === 'done' ? n : idx} />

      <AnimatePresence mode="wait">
        <motion.section
          key={`${step}-${idx}-${step === 'revealed' ? 'r' : ''}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col"
        >
          {step === 'intro' && (
            <Centered>
              <motion.div
                animate={{ rotate: [0, -10, 10, -6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }}
                className="mb-8 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-2xl shadow-violet-900/50"
              >
                <Smartphone size={44} />
              </motion.div>
              <h1 className="font-display text-3xl font-black text-balance">Préparez-vous, la partie va commencer !</h1>
              <p className="mt-4 max-w-xs text-slate-400">
                Le téléphone va passer de main en main. Chacun découvre son rôle <b className="text-slate-200">en secret</b>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Info>{n} joueurs</Info>
                <Info>{g.publicCategoryLabel}</Info>
                <Info className="capitalize">{g.settings.difficulty}</Info>
              </div>
              <Bottom>
                <Button size="xl" block onClick={() => setStep('turn')} data-testid="dist-start">
                  C’EST PARTI
                </Button>
              </Bottom>
            </Centered>
          )}

          {step === 'turn' && (
            <Centered>
              <Avatar name={player.name} size={88} className="mb-6 shadow-2xl ring-4 ring-white/10" />
              <p className="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">C’est au tour de</p>
              <h1 className="mt-1 max-w-full font-display text-5xl font-black break-words text-white" data-testid="turn-name">
                {player.name}
              </h1>
              <p className="mt-5 max-w-xs text-slate-400">Assure-toi que personne d’autre ne regarde l’écran.</p>
              <Bottom>
                <HoldButton onComplete={reveal} icon={<Eye size={22} />} hint="Maintiens le bouton appuyé pour révéler">
                  VOIR MON RÔLE
                </HoldButton>
              </Bottom>
            </Centered>
          )}

          {step === 'revealed' && (
            <div className="flex flex-1 flex-col items-center pt-2">
              <RoleFlipCard flipped={flipped} card={card} playerName={player.name} />
              <Bottom>
                <div className="grid w-full gap-3">
                  {flipped ? (
                    <Button variant="secondary" size="lg" block icon={<EyeOff size={18} />} onClick={hide} data-testid="hide-role">
                      Masquer mon rôle
                    </Button>
                  ) : (
                    <HoldButton onComplete={reveal} icon={<Eye size={20} />} hint="Maintiens appuyé pour revoir">
                      REVOIR MON RÔLE
                    </HoldButton>
                  )}
                  <Button
                    variant="success"
                    size="xl"
                    block
                    icon={<Check size={22} />}
                    onClick={finish}
                    disabled={!canFinish}
                    guardMs={900}
                    data-testid="done-role"
                  >
                    J’AI TERMINÉ
                  </Button>
                </div>
              </Bottom>
            </div>
          )}

          {step === 'pass' && nextPlayer && (
            <Centered>
              <motion.div
                initial={{ x: -30, rotate: -15 }}
                animate={{ x: [-30, 30, -30], rotate: [-15, 15, -15] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-8 text-violet-300"
              >
                <Hand size={64} strokeWidth={1.5} />
              </motion.div>
              <p className="text-slate-400">Passe le téléphone à</p>
              <h1 className="mt-1 max-w-full font-display text-5xl font-black break-words text-white" data-testid="pass-name">
                {nextPlayer.name}
              </h1>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200">
                <EyeOff size={16} /> sans regarder l’écran !
              </p>
              <Bottom>
                <Button size="xl" block onClick={() => setStep('turn')} guardMs={900} data-testid="next-player">
                  JOUEUR SUIVANT
                </Button>
              </Bottom>
            </Centered>
          )}

          {step === 'done' && (
            <Centered>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                className="mb-8 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl shadow-emerald-900/50"
              >
                <PartyPopper size={44} />
              </motion.div>
              <h1 className="font-display text-3xl font-black text-balance">Tout le monde connaît son rôle.</h1>
              <p className="text-gradient mt-2 font-display text-2xl font-bold">Que la partie commence !</p>
              <p className="mt-4 max-w-xs text-sm text-slate-400">Posez le téléphone au centre de la table.</p>
              <Bottom>
                <Button size="xl" block onClick={startDiscussion} data-testid="start-game">
                  COMMENCER
                </Button>
              </Bottom>
            </Centered>
          )}
        </motion.section>
      </AnimatePresence>
    </Screen>
  );
}

function Progress({ total, done }: { total: number; done: number }) {
  return (
    <div className="mb-2 flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-400 to-blue-400"
            initial={false}
            animate={{ width: i < done ? '100%' : '0%' }}
          />
        </div>
      ))}
    </div>
  );
}

/** Contenu centré verticalement, et zone d'actions (<Bottom>) collée en bas. */
function Centered({ children }: { children: React.ReactNode }) {
  const all = Children.toArray(children);
  const bottom = all.filter((c) => isValidElement(c) && c.type === Bottom);
  const content = all.filter((c) => !(isValidElement(c) && c.type === Bottom));
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center pt-6 text-center">{content}</div>
      {bottom}
    </div>
  );
}

function Bottom({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto w-full pt-10">{children}</div>;
}

function Info({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 ${className}`}>{children}</span>;
}
