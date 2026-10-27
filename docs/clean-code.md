# Code propre

Ce qui gouverne l'intérieur des outils de `outils/`. Les frontières — ce que vérifie chaque outil, et pourquoi — sont dans [pratiques.md](pratiques.md).

## Lisibilité

- **Un message de défaut dit quoi corriger, dans le vocabulaire de la fiche.** `plante : « basilic-pourpre » ne désigne aucune fiche de plantes.`, jamais l'erreur brute d'Ajv : celui qui le lit écrit des fiches, pas des schémas. C'est le rôle de `messageDeSchema` dans `verifier.mjs`.
- **Une fonction exportée, testable sans processus** : `verifier(racine)` et `photosHorsLfs(racine)` rendent une liste ; seul le bloc final de chaque fichier écrit sur la console et fixe le code de sortie.

## Conception

- **La configuration décrit, `verifier.mjs` ne nomme aucune collection.** Les dossiers, schémas et liens viennent de `referentiel.yml` : ajouter une collection ne touche pas `verifier.mjs`. Le seul cas particulier, le rangement par année, s'y déclare (`par_annee: true`).
- **Une règle qu'un schéma n'exprime pas vit dans `regles.mjs`, sous le nom de sa collection.** C'est le seul endroit du code qui nomme une collection ou un champ : chaque règle reprend un énoncé du cadrage, lit une fiche déjà conforme à son schéma, et rend ses défauts. Elle se tait quand la fiche qu'elle désigne est absente ou invalide, déjà signalée ailleurs.
- **Une définition commune vit dans le socle.** Un schéma la reprend par `$ref` (`socle.schema.json#/$defs/plages`) plutôt que de la recopier.

## Refactoring

Un changement de forme ne se mêle pas à un changement de comportement : deux commits, et les tests verts entre les deux.

## Outillage

Aucun linter ni formateur n'est configuré : le code tient en deux fichiers. Rien de ce document n'est donc vérifié par un outil ; le premier à le devenir s'ajoute aux contrôles en même temps qu'à ce paragraphe.
