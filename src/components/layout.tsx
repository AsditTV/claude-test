import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, LogOut } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNav } from '../hooks/useNav';
import { useGame } from '../hooks/useGame';
import { ConfirmModal } from './ui';

export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1b1450_0%,#0a0a1f_45%,#05050f_100%)]" />
      <div className="animate-float absolute -top-32 -left-24 h-96 w-96 rounded-full bg-violet-600/25 blur-[100px]" />
      <div
        className="animate-float absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[110px]"
        style={{ animationDelay: '-3s' }}
      />
      <div
        className="animate-float absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[110px]"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
    </div>
  );
}

/** Conteneur de page : colonne centrée, adaptée au téléphone. */
export function Screen({
  children,
  footer,
  className = '',
  wide,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`mx-auto flex min-h-dvh w-full flex-col px-4 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
    >
      <div className={`flex flex-1 flex-col ${className}`}>{children}</div>
      {footer && (
        <div className="safe-bottom sticky bottom-0 z-20 -mx-4 mt-4 bg-gradient-to-t from-night-950 via-night-950/95 to-transparent px-4 pt-6">
          {footer}
        </div>
      )}
    </motion.main>
  );
}

export function TopBar({
  title,
  onBack,
  showQuit,
  right,
}: {
  title?: ReactNode;
  onBack?: () => void;
  showQuit?: boolean;
  right?: ReactNode;
}) {
  const { openRules, go } = useNav();
  const { quitGame } = useGame();
  const [confirmQuit, setConfirmQuit] = useState(false);
  return (
    <header className="safe-top sticky top-0 z-30 -mx-4 mb-2 flex items-center gap-2 bg-night-950/70 px-4 pb-3 backdrop-blur-md">
      {onBack ? (
        <button
          type="button"
          aria-label="Retour"
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>
      ) : showQuit ? (
        <button
          type="button"
          aria-label="Quitter la partie"
          onClick={() => setConfirmQuit(true)}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10"
        >
          <LogOut size={18} />
        </button>
      ) : (
        <span className="w-10" />
      )}
      <div className="min-w-0 flex-1 truncate text-center font-display text-base font-semibold text-slate-200">{title}</div>
      {right}
      <button
        type="button"
        aria-label="Règles du jeu"
        onClick={openRules}
        className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10"
      >
        <BookOpen size={18} />
      </button>
      <ConfirmModal
        open={confirmQuit}
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => {
          setConfirmQuit(false);
          quitGame();
          go('home');
        }}
        title="Quitter la partie ?"
        confirmLabel="Quitter"
        variant="danger"
      >
        La partie en cours sera perdue et ne sera pas enregistrée dans l’historique.
      </ConfirmModal>
    </header>
  );
}
