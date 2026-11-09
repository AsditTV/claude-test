import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Dice5,
  Gauge,
  Layers,
  Play,
  Settings2,
  Shuffle,
  Sparkles,
  Timer,
  Trash2,
  UserPlus,
  Users,
  Wand2,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Screen, TopBar } from '../components/layout';
import { Button, Card, Chip, SectionTitle, Stepper, Toggle } from '../components/ui';
import { useGame } from '../hooks/useGame';
import { useNav } from '../hooks/useNav';
import { builtInCategories, CUSTOM_CATEGORY_ID, loadCustomPairs } from '../data/words';
import { maxImpostors, randomComposition, recommendComposition, validateComposition, MAX_PLAYERS, MIN_PLAYERS } from '../utils/game';
import { applyMode, compositionForMode, duplicateNames, loadSettings, MODES } from '../utils/settings';
import { shuffle } from '../utils/random';
import type { Difficulty, GameSettings } from '../types';

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: 'facile', label: 'Facile', desc: 'Mots très proches', color: 'from-emerald-400 to-teal-500' },
  { id: 'normal', label: 'Normal', desc: 'Lien logique', color: 'from-violet-500 to-blue-500' },
  { id: 'difficile', label: 'Difficile', desc: 'Subtil, débats garantis', color: 'from-rose-500 to-orange-500' },
];

export function SetupPage() {
  const { go } = useNav();
  const { startGame } = useGame();
  const [s, setS] = useState<GameSettings>(loadSettings);
  const customCount = useMemo(() => loadCustomPairs().length, []);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const n = s.playerNames.length;
  const civils = n - s.undercoverCount - s.mrWhiteCount;
  const compError = validateComposition(n, s.undercoverCount, s.mrWhiteCount);
  const dups = duplicateNames(s.playerNames);
  const noMrWhite = s.mode === 'sans-mrwhite';
  const persoEmpty = s.mode === 'perso' && customCount === 0;
  const error = compError ?? (dups.size ? 'Deux joueurs ont le même nom.' : null) ?? (persoEmpty ? 'Ajoutez d’abord vos paires de mots.' : null);

  const update = (patch: Partial<GameSettings>) => setS((prev) => ({ ...prev, ...patch }));
  const setOption = <K extends keyof GameSettings['options']>(k: K, v: GameSettings['options'][K]) =>
    setS((prev) => ({ ...prev, options: { ...prev.options, [k]: v } }));

  const setCount = (count: number) => {
    setS((prev) => {
      const names = prev.playerNames.slice(0, count);
      while (names.length < count) names.push('');
      const comp =
        validateComposition(count, prev.undercoverCount, prev.mrWhiteCount) === null && prev.mode !== 'chaos'
          ? { undercover: prev.undercoverCount, mrWhite: prev.mrWhiteCount }
          : compositionForMode(prev.mode, count);
      return { ...prev, playerNames: names, undercoverCount: comp.undercover, mrWhiteCount: comp.mrWhite };
    });
  };

  const removePlayer = (i: number) => {
    if (n <= MIN_PLAYERS) return;
    setS((prev) => {
      const names = prev.playerNames.filter((_, j) => j !== i);
      const ok = validateComposition(names.length, prev.undercoverCount, prev.mrWhiteCount) === null;
      const comp = ok ? { undercover: prev.undercoverCount, mrWhite: prev.mrWhiteCount } : compositionForMode(prev.mode, names.length);
      return { ...prev, playerNames: names, undercoverCount: comp.undercover, mrWhiteCount: comp.mrWhite };
    });
  };

  const toggleCategory = (id: string) => {
    setS((prev) => {
      const has = prev.categoryIds.includes(id);
      return { ...prev, surprise: false, categoryIds: has ? prev.categoryIds.filter((c) => c !== id) : [...prev.categoryIds, id] };
    });
  };

  const launch = () => {
    if (error) return;
    startGame(s);
    go('game');
  };

  const maxIm = maxImpostors(n);

  return (
    <Screen
      footer={
        <div className="space-y-2">
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 text-center text-sm text-amber-300"
              >
                <AlertTriangle size={16} /> {error}
              </motion.p>
            )}
          </AnimatePresence>
          <Button size="xl" block icon={<Play size={22} />} onClick={launch} disabled={!!error} data-testid="launch">
            LANCER LA PARTIE
          </Button>
        </div>
      }
    >
      <TopBar title="Nouvelle partie" onBack={() => go('home')} />

      <div className="space-y-4 pb-2">
        {/* Mode */}
        <Card>
          <SectionTitle icon={<Gauge size={18} />}>Mode de jeu</SectionTitle>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {MODES.map((m) => (
              <motion.button
                key={m.id}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setS((prev) => applyMode(prev, m.id))}
                aria-pressed={s.mode === m.id}
                className={`flex w-32 shrink-0 flex-col items-start rounded-2xl border p-3 text-left transition ${
                  s.mode === m.id
                    ? 'border-violet-400/60 bg-gradient-to-br from-violet-500/25 to-blue-500/15 shadow-[0_0_24px_-8px_rgba(139,92,246,0.9)]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="mt-1.5 font-display text-sm font-bold text-white">{m.label}</span>
                <span className="text-[11px] leading-tight text-slate-400">{m.desc}</span>
              </motion.button>
            ))}
          </div>
          <div className="mt-4">
            <label className="label" htmlFor="game-name">
              Nom de la partie <span className="normal-case tracking-normal text-slate-600">(facultatif)</span>
            </label>
            <input
              id="game-name"
              className="input"
              placeholder="Soirée du samedi"
              maxLength={40}
              value={s.gameName}
              onChange={(e) => update({ gameName: e.target.value })}
            />
          </div>
        </Card>

        {/* Joueurs */}
        <Card>
          <SectionTitle
            icon={<Users size={18} />}
            right={
              <button
                type="button"
                onClick={() => update({ playerNames: shuffle(s.playerNames) })}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
              >
                <Shuffle size={14} /> Mélanger
              </button>
            }
          >
            Joueurs
          </SectionTitle>
          <Stepper label="Nombre de joueurs" sub="De 3 à 20" value={n} min={MIN_PLAYERS} max={MAX_PLAYERS} onChange={setCount} testId="players" />
          <div className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {s.playerNames.map((name, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-6 text-right font-display text-sm font-semibold text-slate-500 tabular-nums">{i + 1}</span>
                  <input
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    className={`input py-2.5 ${dups.has(i) ? 'border-amber-400/70 ring-2 ring-amber-400/30' : ''}`}
                    placeholder={`Joueur ${i + 1}`}
                    value={name}
                    maxLength={18}
                    enterKeyHint={i === n - 1 ? 'done' : 'next'}
                    autoCapitalize="words"
                    autoComplete="off"
                    data-testid={`player-${i}`}
                    onChange={(e) => {
                      const names = s.playerNames.slice();
                      names[i] = e.target.value;
                      update({ playerNames: names });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = inputs.current[i + 1];
                        if (next) next.focus();
                        else e.currentTarget.blur();
                      }
                    }}
                  />
                  <button
                    type="button"
                    aria-label={`Retirer le joueur ${i + 1}`}
                    onClick={() => removePlayer(i)}
                    disabled={n <= MIN_PLAYERS}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-rose-300 disabled:opacity-20"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {n < MAX_PLAYERS && (
            <button
              type="button"
              onClick={() => {
                setCount(n + 1);
                setTimeout(() => inputs.current[n]?.focus(), 50);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-slate-400 hover:border-violet-400/50 hover:text-violet-200"
            >
              <UserPlus size={16} /> Ajouter un joueur
            </button>
          )}
        </Card>

        {/* Composition */}
        <Card>
          <SectionTitle icon={<Layers size={18} />}>Rôles</SectionTitle>
          <CompositionBar civils={Math.max(0, civils)} undercover={s.undercoverCount} mrWhite={s.mrWhiteCount} />
          <div className="mt-4 space-y-2">
            <Stepper
              label="Undercover"
              sub="Mot proche, mais différent"
              accent="text-rose-300"
              value={s.undercoverCount}
              min={s.mrWhiteCount > 0 ? 0 : 1}
              max={Math.max(0, maxIm - s.mrWhiteCount)}
              onChange={(v) => update({ undercoverCount: v })}
              testId="undercover"
            />
            <Stepper
              label="Mr White"
              sub={noMrWhite ? 'Désactivé dans ce mode' : 'Aucun mot, improvise'}
              accent="text-slate-100"
              value={s.mrWhiteCount}
              min={s.undercoverCount > 0 ? 0 : 1}
              max={noMrWhite ? 0 : Math.max(0, Math.min(3, maxIm - s.undercoverCount))}
              onChange={(v) => update({ mrWhiteCount: v })}
              testId="mrwhite"
            />
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <div>
                <div className="font-display font-semibold text-sky-300">Civils</div>
                <div className="text-xs text-slate-500">Calcul automatique</div>
              </div>
              <span className="pr-12 font-display text-xl font-bold tabular-nums" data-testid="civils-value">
                {civils}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="md"
              icon={<Wand2 size={16} />}
              onClick={() => {
                const c = s.mode === 'chaos' ? compositionForMode('chaos', n) : recommendComposition(n, !noMrWhite);
                update({ undercoverCount: c.undercover, mrWhiteCount: c.mrWhite });
              }}
            >
              Répartition auto
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Dice5 size={16} />}
              onClick={() => {
                const c = randomComposition(n, !noMrWhite);
                update({ undercoverCount: c.undercover, mrWhiteCount: c.mrWhite });
              }}
            >
              Aléatoire
            </Button>
          </div>
        </Card>

        {/* Catégories */}
        <Card>
          <SectionTitle
            icon={<Sparkles size={18} />}
            right={
              <span className="text-xs text-slate-500">
                {s.surprise ? 'Surprise' : s.categoryIds.filter((c) => c !== CUSTOM_CATEGORY_ID).length || 'Toutes'}
              </span>
            }
          >
            Catégories
          </SectionTitle>
          {s.mode === 'perso' ? (
            <div className="rounded-2xl bg-white/[0.04] p-4 text-sm text-slate-300">
              {customCount > 0 ? (
                <p>
                  Partie avec vos <b className="text-white">{customCount}</b> paires personnalisées.
                </p>
              ) : (
                <p>Vous n’avez encore ajouté aucune paire.</p>
              )}
              <Button variant="secondary" size="md" className="mt-3" onClick={() => go('custom')}>
                Gérer mes mots
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <Chip active={!s.surprise && s.categoryIds.length === 0} onClick={() => update({ categoryIds: [], surprise: false })}>
                  🌐 Toutes
                </Chip>
                <Chip active={s.surprise} onClick={() => update({ surprise: !s.surprise, categoryIds: [] })}>
                  🎲 Surprise
                </Chip>
              </div>
              <div className={`flex flex-wrap gap-2 transition ${s.surprise ? 'pointer-events-none opacity-30' : ''}`}>
                {builtInCategories.map((c) => (
                  <Chip key={c.id} active={s.categoryIds.includes(c.id)} onClick={() => toggleCategory(c.id)}>
                    <span className="mr-1">{c.emoji}</span>
                    {c.name}
                    <span className="ml-1.5 text-xs text-slate-500">{c.pairs.length}</span>
                  </Chip>
                ))}
              </div>
              {customCount > 0 && (
                <div className="mt-3">
                  <Toggle
                    checked={s.includeCustom}
                    onChange={(v) => update({ includeCustom: v })}
                    label="Inclure mes mots"
                    desc={`${customCount} paire(s) personnalisée(s)`}
                  />
                </div>
              )}
            </>
          )}
        </Card>

        {/* Difficulté */}
        <Card>
          <SectionTitle icon={<Gauge size={18} />}>Difficulté</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <motion.button
                key={d.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => update({ difficulty: d.id })}
                aria-pressed={s.difficulty === d.id}
                className={`relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                  s.difficulty === d.id ? 'border-white/25' : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {s.difficulty === d.id && (
                  <motion.span layoutId="diff" className={`absolute inset-0 bg-gradient-to-br opacity-30 ${d.color}`} />
                )}
                <span className="relative block font-display font-bold text-white">{d.label}</span>
                <span className="relative block text-[11px] leading-tight text-slate-400">{d.desc}</span>
              </motion.button>
            ))}
          </div>
        </Card>

        {/* Options */}
        <Card>
          <SectionTitle icon={<Settings2 size={18} />}>Options</SectionTitle>
          <div className="space-y-2">
            <Toggle checked={s.options.votesEnabled} onChange={(v) => setOption('votesEnabled', v)} label="Votes secrets" desc="Chacun vote à son tour sur le téléphone. Sinon : vote à main levée." />
            <Toggle checked={s.options.randomOrder} onChange={(v) => setOption('randomOrder', v)} label="Ordre de passage aléatoire" desc="Nouvel ordre de parole à chaque manche" />
            <Toggle checked={s.options.cluesEnabled} onChange={(v) => setOption('cluesEnabled', v)} label="Indice pour Mr White" desc="Mr White découvre la catégorie du mot" />
            <Toggle checked={s.options.hiddenRoles} onChange={(v) => setOption('hiddenRoles', v)} label="Rôles cachés (variante officielle)" desc="Civils et Undercover voient seulement leur mot, sans savoir leur camp" />
            <Toggle checked={s.options.showRules} onChange={(v) => setOption('showRules', v)} label="Afficher les règles" desc="Avant la première manche" />
            <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
              <div className="mb-2 flex items-center gap-2 font-medium text-slate-100">
                <Timer size={16} className="text-slate-400" /> Chrono par indice
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 15, 20, 30, 45].map((t) => (
                  <Chip key={t} active={s.options.speakingTimer === t} onClick={() => setOption('speakingTimer', t)} className="px-1">
                    {t === 0 ? 'Off' : `${t}s`}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Screen>
  );
}

function CompositionBar({ civils, undercover, mrWhite }: { civils: number; undercover: number; mrWhite: number }) {
  const total = Math.max(1, civils + undercover + mrWhite);
  const seg = (v: number, cls: string, key: string) =>
    v > 0 && (
      <motion.div key={key} layout className={`h-full ${cls}`} style={{ width: `${(v / total) * 100}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
    );
  return (
    <div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/5">
        {seg(civils, 'bg-gradient-to-r from-sky-400 to-blue-500', 'c')}
        {seg(undercover, 'bg-gradient-to-r from-rose-500 to-fuchsia-600', 'u')}
        {seg(mrWhite, 'bg-gradient-to-r from-slate-200 to-slate-400', 'w')}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>
          <b className="text-sky-300">{civils}</b> civils
        </span>
        <span>
          <b className="text-rose-300">{undercover}</b> undercover
        </span>
        <span>
          <b className="text-slate-100">{mrWhite}</b> Mr White
        </span>
      </div>
    </div>
  );
}
