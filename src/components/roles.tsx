import { HelpCircle, ShieldCheck, UserRound, VenetianMask } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Role, Winner } from '../types';

export interface RoleMeta {
  label: string;
  short: string;
  gradient: string;
  text: string;
  ring: string;
  glow: string;
  icon: ReactNode;
  team: string;
}

export const ROLE_META: Record<Role | 'agent', RoleMeta> = {
  civil: {
    label: 'CIVIL',
    short: 'Civil',
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    text: 'text-sky-300',
    ring: 'ring-sky-400/40',
    glow: 'shadow-[0_0_60px_-10px_rgba(56,189,248,0.7)]',
    icon: <ShieldCheck />,
    team: 'Civils',
  },
  undercover: {
    label: 'UNDERCOVER',
    short: 'Undercover',
    gradient: 'from-rose-500 via-fuchsia-600 to-purple-700',
    text: 'text-rose-300',
    ring: 'ring-rose-400/40',
    glow: 'shadow-[0_0_60px_-10px_rgba(244,63,94,0.7)]',
    icon: <VenetianMask />,
    team: 'Undercover',
  },
  mrwhite: {
    label: 'MR WHITE',
    short: 'Mr White',
    gradient: 'from-slate-100 via-slate-300 to-slate-500',
    text: 'text-slate-100',
    ring: 'ring-white/40',
    glow: 'shadow-[0_0_60px_-10px_rgba(248,250,252,0.6)]',
    icon: <HelpCircle />,
    team: 'Mr White',
  },
  agent: {
    label: 'AGENT',
    short: 'Agent',
    gradient: 'from-violet-500 via-indigo-600 to-blue-700',
    text: 'text-violet-300',
    ring: 'ring-violet-400/40',
    glow: 'shadow-[0_0_60px_-10px_rgba(139,92,246,0.7)]',
    icon: <UserRound />,
    team: '',
  },
};

export const WINNER_META: Record<Winner, { title: string; subtitle: string; gradient: string; emoji: string }> = {
  civils: {
    title: 'Victoire des Civils',
    subtitle: 'Tous les imposteurs ont été démasqués !',
    gradient: 'from-sky-400 via-blue-500 to-indigo-500',
    emoji: '🛡️',
  },
  undercover: {
    title: 'Victoire des Undercover',
    subtitle: 'Ils se sont fondus dans la masse jusqu’au bout.',
    gradient: 'from-rose-400 via-fuchsia-500 to-purple-600',
    emoji: '🎭',
  },
  mrwhite: {
    title: 'Victoire de Mr White',
    subtitle: 'Sans aucun mot, il a berné tout le monde !',
    gradient: 'from-slate-400 via-slate-600 to-indigo-900',
    emoji: '👻',
  },
  imposteurs: {
    title: 'Victoire des Imposteurs',
    subtitle: 'Undercover et Mr White triomphent ensemble.',
    gradient: 'from-rose-500 via-violet-600 to-slate-700',
    emoji: '🕶️',
  },
};

export function RolePill({ role, className = '' }: { role: Role; className?: string }) {
  const m = ROLE_META[role];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold ring-1 ${m.ring} ${m.text} ${className}`}
    >
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{m.icon}</span>
      {m.short}
    </span>
  );
}

