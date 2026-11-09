import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

// ── Button ────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: Variant;
  size?: 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  block?: boolean;
  onClick?: () => void;
  /** Anti double-tap : ignore les clics répétés pendant ce délai (ms). */
  guardMs?: number;
}

const variants: Record<Variant, string> = {
  primary: 'btn-glow text-white',
  secondary: 'glass text-slate-100 hover:bg-white/10',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  danger: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-900/40',
  success: 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-900/40',
};

const sizes = {
  md: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
  xl: 'h-16 px-7 text-lg rounded-2xl gap-3 tracking-wide',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  icon,
  block,
  className = '',
  children,
  onClick,
  guardMs = 450,
  disabled,
  ...rest
}: ButtonProps) {
  const last = useRef(0);
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      type="button"
      disabled={disabled}
      onClick={() => {
        const now = Date.now();
        if (now - last.current < guardMs) return;
        last.current = now;
        onClick?.();
      }}
      className={`inline-flex select-none items-center justify-center font-display font-semibold transition-colors disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
      {...(rest as object)}
    >
      {icon}
      {children}
    </motion.button>
  );
}

// ── HoldButton : appui long pour confirmer (anti clic accidentel) ──

interface HoldProps {
  children: ReactNode;
  onComplete: () => void;
  duration?: number;
  icon?: ReactNode;
  className?: string;
  hint?: string;
}

export function HoldButton({ children, onComplete, duration = 700, icon, className = '', hint = 'Maintiens appuyé' }: HoldProps) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const done = useRef(false);

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (!done.current) setProgress(0);
  };

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / duration);
    setProgress(p);
    if (p >= 1) {
      done.current = true;
      raf.current = null;
      navigator.vibrate?.(30);
      onComplete();
      setTimeout(() => {
        done.current = false;
        setProgress(0);
      }, 300);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (raf.current || done.current) return;
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className={`w-full ${className}`}>
      <button
        type="button"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          begin();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) begin();
        }}
        onKeyUp={stop}
        className="btn-glow relative flex h-16 w-full select-none items-center justify-center gap-3 overflow-hidden rounded-2xl font-display text-lg font-bold tracking-wide text-white"
        style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        <span
          className="absolute inset-y-0 left-0 bg-white/25"
          style={{ width: `${progress * 100}%`, transition: progress === 0 ? 'width .2s' : 'none' }}
        />
        <span className="relative flex items-center gap-3">
          {icon}
          {children}
        </span>
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">{hint}</p>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ icon, children, right }: { icon?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
        {icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-300">{icon}</span>}
        {children}
      </h2>
      {right}
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  sub?: string;
  accent?: string;
  testId?: string;
}

export function Stepper({ value, min, max, onChange, label, sub, accent = 'text-white', testId }: StepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3" data-testid={testId}>
      <div className="min-w-0">
        <div className={`font-display font-semibold ${accent}`}>{label}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Moins de ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="ctl grid h-10 w-10 place-items-center rounded-xl transition"
        >
          <Minus size={18} />
        </button>
        <motion.span
          key={value}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-8 text-center font-display text-xl font-bold tabular-nums"
          data-testid={testId ? `${testId}-value` : undefined}
        >
          {value}
        </motion.span>
        <button
          type="button"
          aria-label={`Plus de ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="ctl grid h-10 w-10 place-items-center rounded-xl transition"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  label,
  desc,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.07]"
    >
      {icon && <span className="text-slate-400">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-slate-100">{label}</span>
        {desc && <span className="block text-xs text-slate-500">{desc}</span>}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-gradient-to-r from-violet-500 to-blue-500' : 'bg-white/10'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${checked ? 'right-1' : 'left-1'}`}
        />
      </span>
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  children,
  title,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, pointerEvents: 'auto' }}
          // Pendant la fermeture, la fenêtre ne doit plus capter les appuis.
          exit={{ opacity: 0, pointerEvents: 'none' }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className={`safe-bottom relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-night-900 p-6 shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            {title && <h3 className="mb-4 pr-10 font-display text-xl font-bold">{title}</h3>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirmer',
  variant = 'primary',
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  variant?: Variant;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {children && <div className="mb-6 text-slate-300">{children}</div>}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant={variant} onClick={onConfirm} guardMs={800}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// ── Avatar ────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-violet-500 to-fuchsia-500',
  'from-blue-500 to-cyan-400',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-violet-500',
  'from-sky-400 to-blue-600',
  'from-lime-400 to-emerald-500',
];

export function Avatar({ name, size = 40, dim, className = '' }: { name: string; size?: number; dim?: boolean; className?: string }) {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-display font-bold text-white ${color} ${dim ? 'opacity-35 grayscale' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

// ── Chip ──────────────────────────────────────────────────────

export function Chip({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
        active
          ? 'border-violet-400/60 bg-violet-500/20 text-white shadow-[0_0_20px_-6px_rgba(139,92,246,0.8)]'
          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}
