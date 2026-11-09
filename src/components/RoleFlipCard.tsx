import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import type { RoleCard } from '../types';
import { ROLE_META } from './roles';
import { SpyMark } from '../pages/HomePage';

/**
 * Carte retournable. Le contenu secret (`card`) n'est passé QUE lorsque
 * la carte doit être visible : face cachée, aucun mot n'existe dans le DOM.
 */
export function RoleFlipCard({ flipped, card, playerName }: { flipped: boolean; card: RoleCard | null; playerName: string }) {
  return (
    <div className="mx-auto w-full max-w-[19rem]" style={{ perspective: 1200 }}>
      <motion.div
        className="preserve-3d relative aspect-[3/4] w-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      >
        {/* Dos de la carte */}
        <div className="backface-hidden absolute inset-0 overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 shadow-2xl">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 2px, transparent 2px 14px)',
            }}
          />
          <div className="absolute inset-3 rounded-[1.6rem] border border-white/20" />
          <div className="relative flex h-full flex-col items-center justify-center gap-4">
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-white/10 backdrop-blur">
              <SpyMark size={56} />
            </div>
            <p className="font-display text-sm font-bold tracking-[0.3em] text-white/80">TOP SECRET</p>
            <p className="max-w-[80%] truncate text-center font-display text-lg font-semibold text-white">{playerName}</p>
          </div>
        </div>

        {/* Face : rôle */}
        <div
          className="backface-hidden absolute inset-0 overflow-hidden rounded-[2rem] border border-white/15 bg-night-900 shadow-2xl"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {card && <CardFace card={card} />}
        </div>
      </motion.div>
    </div>
  );
}

function CardFace({ card }: { card: RoleCard }) {
  const m = ROLE_META[card.displayedRole];
  return (
    <div className="relative flex h-full flex-col" data-testid="role-face">
      <div className={`absolute inset-x-0 top-0 h-1/2 bg-gradient-to-br opacity-90 ${m.gradient}`} />
      <div className="absolute inset-x-0 top-[38%] h-1/4 bg-gradient-to-b from-transparent to-night-900" />
      <div className="relative flex flex-1 flex-col items-center px-5 pt-7 text-center">
        <span
          className={`grid h-16 w-16 place-items-center rounded-2xl bg-black/25 backdrop-blur [&>svg]:h-8 [&>svg]:w-8 ${card.displayedRole === 'mrwhite' ? 'text-slate-900' : 'text-white'}`}
        >
          {m.icon}
        </span>
        <p className={`mt-3 text-[11px] font-bold tracking-[0.3em] ${card.displayedRole === 'mrwhite' ? 'text-slate-800' : 'text-white/80'}`}>
          TON RÔLE
        </p>
        <h2
          className={`font-display text-3xl font-black tracking-wide ${card.displayedRole === 'mrwhite' ? 'text-slate-900' : 'text-white'}`}
          data-testid="role-label"
        >
          {m.label}
        </h2>

        <div className="mt-auto mb-6 w-full">
          {card.word ? (
            <>
              <p className="text-xs font-semibold tracking-[0.25em] text-slate-400">TON MOT</p>
              <p className="mt-1 font-display text-[clamp(1.6rem,8vw,2.4rem)] leading-tight font-extrabold break-words text-white" data-testid="role-word">
                {card.word}
              </p>
              {card.displayedRole === 'agent' && (
                <p className="mt-2 text-xs text-slate-500">Civil ou Undercover ? À toi de le découvrir…</p>
              )}
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-extrabold text-white">Tu n’as aucun mot !</p>
              <p className="mt-1 text-sm text-slate-400">Écoute bien les autres et improvise.</p>
              {card.hint && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 text-sm text-amber-200">
                  <Lightbulb size={14} /> Catégorie : {card.hint}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
