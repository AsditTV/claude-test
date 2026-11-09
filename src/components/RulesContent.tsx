import { HelpCircle, ShieldCheck, VenetianMask } from 'lucide-react';

export const RULES = [
  'Chaque joueur doit donner un indice sur son mot.',
  'Les joueurs parlent chacun leur tour.',
  'Les indices doivent être assez précis pour les civils, mais pas trop évidents pour les Undercover.',
  'Mr White doit improviser puisqu’il ne connaît pas le mot.',
  'Après le tour de parole, les joueurs votent pour éliminer quelqu’un.',
  'Le joueur ayant reçu le plus de votes est éliminé (second vote en cas d’égalité).',
  'Son rôle est révélé.',
  'La partie continue jusqu’à ce qu’une équipe gagne.',
];

export function RulesContent({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-2.5">
        <RoleLine
          icon={<ShieldCheck size={20} />}
          color="text-sky-300 bg-sky-500/10"
          title="Civil"
          text="Possède le mot commun. Démasque les imposteurs."
        />
        <RoleLine
          icon={<VenetianMask size={20} />}
          color="text-rose-300 bg-rose-500/10"
          title="Undercover"
          text="A un mot proche mais différent, sans le savoir. Personne ne sait s’il est Civil ou Undercover."
        />
        <RoleLine
          icon={<HelpCircle size={20} />}
          color="text-slate-100 bg-white/10"
          title="Mr White"
          text="N’a aucun mot. Improvise et devine le mot des civils."
        />
      </div>

      <ol className="space-y-2.5">
        {RULES.map((r, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 font-display text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5 text-[15px] leading-snug text-slate-300">{r}</span>
          </li>
        ))}
      </ol>

      {!compact && (
        <div className="space-y-2 rounded-2xl bg-white/[0.04] p-4 text-sm text-slate-400">
          <p className="font-display font-semibold text-slate-200">Conditions de victoire</p>
          <p>
            <b className="text-sky-300">Civils</b> : il ne reste plus aucun Undercover ni Mr White.
          </p>
          <p>
            <b className="text-rose-300">Imposteurs</b> : les Undercover et Mr White encore en jeu sont aussi nombreux que les civils restants.
          </p>
          <p>
            <b className="text-slate-100">Mr White</b> : s’il est éliminé, il a une dernière chance de deviner le mot des civils. S’il trouve, il gagne
            immédiatement.
          </p>
        </div>
      )}
    </div>
  );
}

function RoleLine({ icon, color, title, text }: { icon: React.ReactNode; color: string; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>{icon}</span>
      <div>
        <div className="font-display font-semibold text-white">{title}</div>
        <div className="text-sm text-slate-400">{text}</div>
      </div>
    </div>
  );
}
