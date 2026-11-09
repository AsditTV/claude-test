---
name: video-to-lesson
description: Transforme la transcription d'une vidéo en fiche de cours : résumé, exercices, quiz. À utiliser quand l'utilisateur fournit une vidéo, une transcription ou des sous-titres et veut apprendre ou réviser leur contenu.
---

# Video to lesson

## Entrée
- Accepter un texte de transcription, un fichier .txt/.srt/.vtt, ou des sous-titres collés.
- Si seule une vidéo ou un lien est fourni : NE RIEN INSTALLER ni télécharger. Demander à l'utilisateur s'il fournit la transcription lui-même ou s'il autorise un outil précis (nommer l'outil et sa source). Attendre sa réponse.

## Sortie (Markdown)
1. **Fiche résumé** : titre, objectif en une phrase, 5–8 points clés, définitions des termes importants, horodatages si disponibles.
2. **Exercices** : 3–5, du plus simple au plus difficile, avec corrigé séparé en fin de document.
3. **Quiz** : 8–10 questions (QCM et vrai/faux), réponses + courte justification à la fin.

## Règles
- Rester fidèle à la transcription ; signaler `[à vérifier]` ce qui semble faux ou ambigu plutôt que corriger en silence.
- Ne rien ajouter qui n'est pas dans la source, sauf mention explicite « complément ».
