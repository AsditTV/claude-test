---
name: token-diet
description: Règles d'économie de tokens. À utiliser quand la session devient longue, que l'utilisateur parle de coût, de limite, de contexte saturé, ou demande s'il faut /compact ou /clear.
---

# Token diet

## Réponses
- Répondre d'abord, expliquer ensuite si besoin. Pas d'intro, pas de récap final redondant.
- Montrer un diff ou l'extrait modifié, jamais un fichier entier réécrit.
- Pas de liste d'options non retenues : une recommandation.

## Fichiers
- Référencer `chemin/fichier.ext:ligne` au lieu de coller du code.
- Lire uniquement la plage utile (offset/limit, grep) plutôt que le fichier complet.
- Demander à l'utilisateur un chemin plutôt qu'un copier-coller de logs : les écrire dans un fichier puis les lire en partie.

## /compact ou /clear
- `/compact` : même tâche, contexte long (beaucoup de lectures/sorties). Ajouter une consigne : `/compact garde les décisions et les fichiers modifiés`.
- `/clear` : changement de sujet. L'ancien contexte coûte sans aider.
- Avant `/clear`, noter dans un fichier (ou CLAUDE.md, après validation) ce qui doit survivre.
- Suggérer l'un ou l'autre de façon proactive, en une phrase, quand c'est pertinent.
