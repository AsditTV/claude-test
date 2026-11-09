import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Screen, TopBar } from '../components/layout';
import { ROLE_META } from '../components/roles';
import { Avatar, Button } from '../components/ui';
import { useGame } from '../hooks/useGame';

/** Révélation dramatique du rôle du joueur éliminé. */
export function RevealPage() {
  const { game, afterReveal } = useGame();
  const g = game!;
  const last = g.eliminations[g.eliminations.length - 1];
  const player = g.players.find((p) => p.id === last.playerId)!;
  const meta = ROLE_META[last.role];
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const methodLabel =
    last.method === 'vote' || last.method === 'revote'
      ? `${last.votes ?? 0} voix${last.method === 'revote' ? ' au second tour' : ''}`
      : last.method === 'lot'
        ? 'Tiré au sort'
        : 'Vote à main levée';

  return (
    <Screen className="pb-6">
      <TopBar showQuit title={`Manche ${g.round}`} />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }}>
          <Avatar name={player.name} size={104} className={`mx-auto ring-4 transition-all duration-700 ${shown ? meta.ring : 'ring-white/10'}`} />
        </motion.div>
        <h1 className="mt-5 font-display text-4xl font-black break-words">{player.name}</h1>
        <p className="mt-1 text-slate-400">est éliminé · {methodLabel}</p>

        <div className="mt-10 h-48 w-full max-w-xs" style={{ perspective: 1000 }}>
          {!shown ? (
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="glass grid h-full place-items-center rounded-3xl"
            >
              <p className="font-display text-xl font-bold tracking-[0.3em] text-slate-400">IL ÉTAIT…</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 140, damping: 14 }}
              className={`relative grid h-full place-items-center overflow-hidden rounded-3xl bg-gradient-to-br ${meta.gradient} ${meta.glow}`}
              data-testid="revealed-role"
            >
              <div className="flex flex-col items-center gap-2">
                <span className={`[&>svg]:h-12 [&>svg]:w-12 ${last.role === 'mrwhite' ? 'text-slate-900' : 'text-white'}`}>{meta.icon}</span>
                <span className={`font-display text-3xl font-black tracking-wide ${last.role === 'mrwhite' ? 'text-slate-900' : 'text-white'}`}>
                  {meta.label}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {shown && last.role === 'mrwhite' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 max-w-xs text-sm text-slate-300">
            Mr White a une dernière chance : s’il devine le mot des civils, il gagne immédiatement !
          </motion.p>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: shown ? 1 : 0 }} className="pt-6">
        <Button
          size="xl"
          block
          disabled={!shown}
          icon={last.role === 'mrwhite' ? <Sparkles size={22} /> : <ArrowRight size={22} />}
          onClick={afterReveal}
          data-testid="after-reveal"
        >
          {last.role === 'mrwhite' ? 'DERNIÈRE CHANCE' : 'CONTINUER'}
        </Button>
      </motion.div>
    </Screen>
  );
}
