# Undercover — le jeu d'infiltration sur un seul téléphone

Jeu d'ambiance pour 3 à 20 joueurs : le téléphone passe de main en main, chacun découvre son rôle en secret (Civil, Undercover ou Mr White), puis on donne des indices, on vote et on élimine jusqu'à la victoire d'un camp.

**Stack :** React 19 · TypeScript · Vite · Tailwind CSS 4 · Framer Motion · Lucide. 100 % côté client, sans compte ni backend.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173 (accessible aussi depuis le téléphone sur le même Wi-Fi)
npm test             # tests unitaires (rôles, votes, victoires, banque de mots)
npm run words:check  # valide la banque de mots et affiche les comptes
npm run build        # build de production dans dist/
node scripts/e2e-smoke.cjs http://localhost:5173/   # partie complète simulée sur iPhone (Playwright)
```

## Déployer sur Vercel

Importer le dépôt dans Vercel : le framework Vite est détecté (`vercel.json` fourni). Aucune variable d'environnement n'est nécessaire.

## Structure

```
src/
  components/   UI réutilisable (boutons, appui long, carte retournable, modales…)
  pages/        Accueil, Configuration, Distribution, Règles, Jeu, Vote, Révélation, Mr White, Résultats, Historique, Stats, Mes mots
  data/         words.json (banque de mots) + chargement des paires perso
  hooks/        useGame (état de la partie), useNav (navigation)
  utils/        game.ts (logique pure + tests), secretVault.ts (secrets), storage, settings, history
  types/
```

### Séparation secret / public

- `utils/secretVault.ts` est le **seul** module qui détient les rôles et les mots. Il n'expose que : la carte d'un joueur, le rôle d'un joueur éliminé, la vérification de la devinette de Mr White, et le dévoilement complet sur l'écran de résultats.
- L'état React public (`GameState`) ne contient jamais de mot ni le rôle d'un joueur encore en jeu.
- Navigation par état : rien dans l'URL. Le secret est conservé en `sessionStorage` sous forme encodée (pour survivre à un rafraîchissement), jamais en clair.
- La carte de rôle n'est insérée dans le DOM que pendant la révélation (appui long requis), et retirée dès qu'elle est masquée ou validée.

## Ajouter des mots

Éditer `src/data/words.json` : chaque catégorie contient des paires `["Mot A", "Mot B", niveau]` avec `1` = facile, `2` = normal, `3` = difficile. L'attribution civil/undercover est tirée au sort à chaque partie. Lancer `npm run words:check` ensuite.

Les joueurs peuvent aussi ajouter leurs propres paires dans l'app (« Mes mots »), stockées sur l'appareil.

## Règles de victoire implémentées

- **Civils** : plus aucun Undercover ni Mr White en jeu.
- **Imposteurs** : (Undercover + Mr White en jeu) ≥ civils en jeu. Victoire « Undercover », « Mr White » ou commune selon qui survit.
- **Mr White** éliminé : une tentative pour deviner le mot des civils (accents, casse, articles et une faute de frappe tolérés). S'il trouve, il gagne immédiatement ; sinon la partie continue.
- **Égalité** au vote : second vote entre les ex æquo, puis tirage au sort si l'égalité persiste.
