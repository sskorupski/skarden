# Pratiques

## Ce qui se vérifie, et où

Le référentiel est des données : ce qui le garde sain est la vérification, pas la relecture. Deux outils, lancés à chaque demande de fusion par [`controles.yml`](../.github/workflows/controles.yml) :

- `outils/verifier.mjs` lit `referentiel.yml`, valide chaque frontmatter contre le schéma de sa collection — chaque schéma reprend par `$ref` les définitions de `schemas/socle.schema.json` —, et résout chaque lien d'une fiche vers une autre (ceux que `referentiel.yml` déclare : `plante`, `animal`, `famille`, `aliments.*`, `culture`, `elevage`…) et vers ses photos. Il applique ensuite à chaque fiche valide les règles de `outils/regles.mjs`, celles qu'un schéma n'exprime pas seul : deux plages d'un même paramètre ne se chevauchent pas et leur minimum ne dépasse pas leur maximum ; les phases d'un mode couvrent les douze mois, et un mode n'est défini qu'une fois par fiche ; le `mode` d'un élevage existe dans sa fiche animal ; `elevage_parent` est présent si et seulement si l'origine est `souche` ; une espèce désigne une famille de son règne ; l'`id` d'un élevage commence par l'année de son début ; un élevage terminé ou perdu a une fin, un élevage en cours n'en a pas. Il rend une liste de défauts, un par fiche fautive : une fiche invalide n'est pas signalée une seconde fois sur celles qui la citent.
- `outils/verifier-lfs.mjs` lit l'index Git, et non la copie de travail, pour l'INV-3 : une photo bien rangée y est un pointeur, que LFS ait téléchargé l'image ou non.

## Faire évoluer le format

Un champ, une valeur autorisée ou une collection est une décision de format : elle se cadre d'abord dans [ssk-it/skarden-cadrage](https://github.com/ssk-it/skarden-cadrage). Puis, dans une même demande de fusion :

1. le schéma de `schemas/` et, pour une collection ou un lien, `referentiel.yml` ;
2. le modèle de `modeles/`, que les tests éprouvent ;
3. un test qui échoue sans le changement ;
4. les fiches existantes, mises en conformité — `pnpm verifier` doit rester vert.

Un champ ajouté reste facultatif tant que des fiches existent sans lui. Le renommer, c'est réécrire toutes les fiches : y regarder à deux fois (INV-2).

## Les tests

Le lanceur de Node (`node --test`), sans dépendance de test. Chaque test fabrique un référentiel jetable dans un dossier temporaire, peuplé des modèles et des fiches de `tests/fixtures/` que les modèles désignent — tirées du guide d'élevage d'escargots —, puis y introduit un seul défaut et vérifie qu'il est signalé une fois, sur la bonne fiche. Test rouge d'abord : un test qui n'a jamais échoué n'a rien prouvé.

## Le cycle de livraison

Une copie liée par sujet, une branche, une demande de fusion vers `main` : les contrôles doivent passer. La branche distante disparaît à la fusion. Il n'y a pas de version publiée : `main` est le référentiel.
