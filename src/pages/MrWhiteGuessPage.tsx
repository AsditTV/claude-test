import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { Screen, TopBar } from '../components/layout';
import { Button, ConfirmModal } from '../components/ui';
import { useGame } from '../hooks/useGame';

export function MrWhiteGuessPage() {
  const { game, submitGuess, continueAfterGuess } = useGame();
  const g = game!;
  const last = g.eliminations[g.eliminations.length - 1];
  const player = g.players.find((p) => p.id === last.playerId)!;
  const [guess, setGuess] = useState('');
  const [confirm, setConfirm] = useState(false);
  const answered = last.mrWhiteGuess !== undefined;

  return (
    <Screen className="pb-6">
      <TopBar showQuit title="Dernière chance" />
      {!answered ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mb-6 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-white to-slate-400 text-slate-900 shadow-[0_0_60px_-10px_rgba(255,255,255,0.6)]"
            >
              <HelpCircle size={48} />
            </motion.div>
            <p className="text-sm text-slate-400">{player.name}, tu étais Mr White.</p>
            <h1 className="mt-1 font-display text-3xl font-black text-balance">Quel est le mot des civils ?</h1>
            <form
              className="mt-8 w-full"
              onSubmit={(e) => {
                e.preventDefault();
                if (guess.trim()) setConfirm(true);
              }}
            >
              <input
                autoFocus
                className="input h-14 text-center font-display text-xl"
                placeholder="Ta proposition…"
                value={guess}
                maxLength={40}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setGuess(e.target.value)}
                data-testid="guess-input"
              />
              <p className="mt-2 text-xs text-slate-500">Les accents et majuscules ne comptent pas.</p>
            </form>
          </div>
          <Button size="xl" block icon={<Send size={20} />} disabled={!guess.trim()} onClick={() => setConfirm(true)} data-testid="guess-submit">
            VALIDER MA RÉPONSE
          </Button>
          <ConfirmModal
            open={confirm}
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              setConfirm(false);
              submitGuess(guess);
            }}
            title="Réponse définitive ?"
            confirmLabel="Valider"
          >
            Tu proposes <b className="text-white">« {guess.trim()} »</b>. Une seule tentative possible !
          </ConfirmModal>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} className="text-7xl">
              {last.guessCorrect ? '🎯' : '❌'}
            </motion.p>
            <h1 className="mt-6 font-display text-4xl font-black" data-testid="guess-result">
              {last.guessCorrect ? 'Bien joué !' : 'Raté !'}
            </h1>
            <p className="mt-2 max-w-xs text-slate-400">
              {last.guessCorrect
                ? `« ${last.mrWhiteGuess} » était bien le mot des civils. Mr White remporte la partie !`
                : `« ${last.mrWhiteGuess} » n’est pas le mot des civils. La partie continue…`}
            </p>
          </div>
          <Button size="xl" block icon={<ArrowRight size={22} />} onClick={continueAfterGuess} data-testid="guess-continue">
            {last.guessCorrect ? 'VOIR LES RÉSULTATS' : 'CONTINUER'}
          </Button>
        </>
      )}
    </Screen>
  );
}
