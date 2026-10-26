# Code propre

Ce qui gouverne l'intérieur des outils de `outils/`. Les frontières — ce que vérifie chaque outil, et pourquoi — sont dans [pratiques.md](pratiques.md).

## Lisibilité

- **Un message de défaut dit quoi corriger, dans le vocabulaire de la fiche.** `plante : « basilic-pourpre » ne désigne aucune fiche de plantes.`, jamais l'erreur brute d'Ajv : celui qui le lit écrit des fiches, pas des schémas. C'est le rôle de `messageDeSchema` dans `verifier.mjs`.
- **Une fonction exportée, testable sans processus** : `verifier(racine)` et `photosHorsLfs(racine)` rendent une liste ; seul le bloc final de chaque fichier écrit sur la console et fixe le code de sortie.

## Conception

- **La configuration décrit, le code ne nomme aucune collection.** Les dossiers, schémas et liens viennent de `referentiel.yml` : ajouter une collection ne touche pas `verifier.mjs`. Le seul cas particulier, le rangement par année, s'y déclare (`par_annee: true`).

## Refactoring

Un changement de forme ne se mêle pas à un changement de comportement : deux commits, et les tests verts entre les deux.

## Outillage

Aucun linter ni formateur n'est configuré : le code tient en deux fichiers. Rien de ce document n'est donc vérifié par un outil ; le premier à le devenir s'ajoute aux contrôles en même temps qu'à ce paragraphe.
