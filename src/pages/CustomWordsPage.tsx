import { AnimatePresence, motion } from 'framer-motion';
import { Plus, PenLine, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Screen, TopBar } from '../components/layout';
import { Button, Card, Chip } from '../components/ui';
import { useNav } from '../hooks/useNav';
import { loadCustomPairs, saveCustomPairs } from '../data/words';
import { normalizeWord } from '../utils/game';
import { uid } from '../utils/random';
import type { CustomPair, PairLevel } from '../types';

const LEVELS: { v: PairLevel; label: string }[] = [
  { v: 1, label: 'Facile' },
  { v: 2, label: 'Normal' },
  { v: 3, label: 'Difficile' },
];

export function CustomWordsPage() {
  const { go } = useNav();
  const [pairs, setPairs] = useState<CustomPair[]>(loadCustomPairs);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [level, setLevel] = useState<PairLevel>(2);
  const [error, setError] = useState<string | null>(null);

  const persist = (next: CustomPair[]) => {
    setPairs(next);
    saveCustomPairs(next);
  };

  const add = () => {
    const x = a.trim();
    const y = b.trim();
    if (!x || !y) return setError('Remplissez les deux mots.');
    if (normalizeWord(x) === normalizeWord(y)) return setError('Les deux mots doivent être différents.');
    const key = [normalizeWord(x), normalizeWord(y)].sort().join('|');
    if (pairs.some((p) => [normalizeWord(p.a), normalizeWord(p.b)].sort().join('|') === key)) return setError('Cette paire existe déjà.');
    persist([{ id: uid(), a: x, b: y, level }, ...pairs]);
    setA('');
    setB('');
    setError(null);
  };

  return (
    <Screen className="pb-8">
      <TopBar title="Mes mots" onBack={() => go('home')} />
      <Card className="mb-4">
        <p className="mb-4 text-sm text-slate-400">
          Ajoutez vos propres paires. Lors d’une partie, l’un des deux mots est attribué aux civils et l’autre aux Undercover, au hasard.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Mot 1" value={a} maxLength={40} onChange={(e) => setA(e.target.value)} data-testid="custom-a" />
            <input className="input" placeholder="Mot 2" value={b} maxLength={40} onChange={(e) => setB(e.target.value)} data-testid="custom-b" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <Chip key={l.v} active={level === l.v} onClick={() => setLevel(l.v)}>
                {l.label}
              </Chip>
            ))}
          </div>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          <Button block icon={<Plus size={18} />} onClick={add} data-testid="custom-add">
            Ajouter la paire
          </Button>
        </form>
      </Card>

      {pairs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-slate-500">
          <PenLine size={40} strokeWidth={1.5} />
          <p className="mt-3 text-sm">Aucune paire personnalisée pour l’instant.</p>
        </div>
      ) : (
        <Card>
          <p className="label">{pairs.length} paire(s)</p>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {pairs.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate">
                    <b className="text-white">{p.a}</b> <span className="text-slate-500">/</span> <b className="text-white">{p.b}</b>
                  </span>
                  <span className="text-xs text-slate-500">{LEVELS.find((l) => l.v === p.level)?.label}</span>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={() => persist(pairs.filter((x) => x.id !== p.id))}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-rose-300"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      )}
    </Screen>
  );
}
