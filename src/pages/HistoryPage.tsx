import { Calendar, ChevronDown, Clock, History, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen, TopBar } from '../components/layout';
import { RolePill, WINNER_META } from '../components/roles';
import { Card, ConfirmModal } from '../components/ui';
import { useNav } from '../hooks/useNav';
import { clearHistory, loadHistory } from '../utils/history';

export function HistoryPage() {
  const { go } = useNav();
  const [history, setHistory] = useState(loadHistory);
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  return (
    <Screen className="pb-8">
      <TopBar
        title="Historique"
        onBack={() => go('home')}
        right={
          history.length > 0 && (
            <button
              type="button"
              aria-label="Effacer l'historique"
              onClick={() => setConfirm(true)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-400 hover:text-rose-300"
            >
              <Trash2 size={18} />
            </button>
          )
        }
      />
      {history.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm text-slate-500">{history.length} partie(s) enregistrée(s)</p>
          {history.map((h) => {
            const w = WINNER_META[h.winner];
            const isOpen = open === h.id;
            return (
              <Card key={h.id} className="p-0">
                <button type="button" onClick={() => setOpen(isOpen ? null : h.id)} className="flex w-full items-center gap-3 p-4 text-left">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl ${w.gradient}`}>{w.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-semibold text-white">{h.name}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {h.civilWord} / {h.undercoverWord}
                    </span>
                    <span className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {Math.max(1, Math.round(h.durationSec / 60))} min
                      </span>
                    </span>
                  </span>
                  <ChevronDown size={18} className={`text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="border-t border-white/5 px-4 pt-3 pb-4">
                        <p className="mb-2 text-sm font-semibold text-slate-200">{w.title}</p>
                        <p className="mb-3 text-xs text-slate-500">
                          {h.categoryName} · {h.difficulty} · {h.rounds} manche(s)
                        </p>
                        <ul className="space-y-1.5">
                          {h.players.map((p) => (
                            <li key={p.name} className="flex items-center gap-2 text-sm">
                              <span className="w-5 text-center">{p.won ? '👑' : ''}</span>
                              <span className="flex-1 truncate">{p.name}</span>
                              {p.eliminatedRank && <span className="text-xs text-slate-500">#{p.eliminatedRank}</span>}
                              <RolePill role={p.role} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmModal
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          clearHistory();
          setHistory([]);
          setConfirm(false);
        }}
        title="Effacer l’historique ?"
        confirmLabel="Effacer"
        variant="danger"
      >
        Toutes les parties et statistiques seront supprimées de cet appareil.
      </ConfirmModal>
    </Screen>
  );
}

function Empty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-500">
      <History size={48} strokeWidth={1.5} />
      <p className="mt-4 font-display text-lg font-semibold text-slate-300">Aucune partie pour l’instant</p>
      <p className="mt-1 text-sm">Vos parties terminées apparaîtront ici.</p>
    </div>
  );
}
