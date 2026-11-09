import { motion } from 'framer-motion';
import { BarChart3, BookOpen, History, PenLine, Play, RotateCcw, Sparkles, Users } from 'lucide-react';
import { Screen } from '../components/layout';
import { Button } from '../components/ui';
import { useNav } from '../hooks/useNav';
import { useGame } from '../hooks/useGame';
import { builtInCategories, totalPairs, totalWords } from '../data/words';
import { loadSettings, resolveNames } from '../utils/settings';
import { readJSON, KEYS } from '../utils/storage';

export function HomePage() {
  const { go, openRules } = useNav();
  const { game, startGame } = useGame();
  const hasLast = readJSON(KEYS.settings, null) !== null;
  const last = hasLast ? loadSettings() : null;
  const lastNames = last ? resolveNames(last.playerNames) : [];

  return (
    <Screen className="justify-center py-10">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="relative mb-7"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-500 to-blue-500 opacity-60 blur-2xl" />
          <div className="relative grid h-28 w-28 place-items-center rounded-[2rem] border border-white/15 bg-gradient-to-br from-violet-600/90 via-indigo-600/90 to-blue-600/90 shadow-2xl">
            <SpyMark />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-2 text-xs font-semibold tracking-[0.35em] text-violet-300/80 uppercase"
        >
          Le jeu d’infiltration
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="text-gradient animate-shine font-display text-[3.4rem] leading-none font-black tracking-tight sm:text-7xl"
        >
          UNDERCOVER
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="mt-4 max-w-xs text-balance text-slate-400"
        >
          Un seul téléphone, des amis, et un imposteur parmi vous. Saurez-vous le démasquer ?
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 w-full space-y-3"
        >
          {game && (
            <Button size="xl" block variant="success" icon={<Play size={22} />} onClick={() => go('game')}>
              REPRENDRE LA PARTIE
            </Button>
          )}
          <Button size="xl" block icon={<Sparkles size={22} />} onClick={() => go('setup')} data-testid="new-game">
            NOUVELLE PARTIE
          </Button>
          {last && !game && (
            <Button
              size="lg"
              block
              variant="secondary"
              icon={<RotateCcw size={18} />}
              onClick={() => {
                startGame(last);
                go('game');
              }}
            >
              <span className="truncate">Rejouer · {lastNames.length} joueurs</span>
            </Button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-6 grid w-full grid-cols-4 gap-2"
        >
          <Tile icon={<BookOpen size={20} />} label="Règles" onClick={openRules} />
          <Tile icon={<History size={20} />} label="Historique" onClick={() => go('history')} />
          <Tile icon={<BarChart3 size={20} />} label="Stats" onClick={() => go('stats')} />
          <Tile icon={<PenLine size={20} />} label="Mes mots" onClick={() => go('custom')} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs whitespace-nowrap text-slate-500"
        >
          <span className="flex items-center gap-1.5">
            <Users size={14} /> 3 à 20 joueurs
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>{totalWords.toLocaleString('fr-FR')} mots</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>{builtInCategories.length} catégories</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>{totalPairs.toLocaleString('fr-FR')} paires</span>
        </motion.div>
      </div>
    </Screen>
  );
}

function Tile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      type="button"
      onClick={onClick}
      className="glass flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3.5 text-slate-300 transition hover:text-white"
    >
      <span className="text-violet-300">{icon}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </motion.button>
  );
}

export function SpyMark({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M12 30c4-11 36-11 40 0" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <rect x="8" y="29" width="48" height="6" rx="3" fill="white" />
      <circle cx="22" cy="44" r="7" stroke="white" strokeWidth="4" />
      <circle cx="42" cy="44" r="7" stroke="white" strokeWidth="4" />
      <path d="M29 44h6" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
