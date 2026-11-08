# Pratiques

## Ce qui se vérifie, et où

Le référentiel est des données : ce qui le garde sain est la vérification, pas la relecture. Deux outils, lancés à chaque demande de fusion par [`controles.yml`](../.github/workflows/controles.yml) :

- `outils/verifier.mjs` lit `referentiel.yml`, valide chaque frontmatter contre le schéma de sa collection — chaque schéma reprend par `$ref` les définitions de `schemas/socle.schema.json` —, et résout chaque lien d'une fiche vers une autre (ceux que `referentiel.yml` déclare : `plante`, `animal`, `famille`, `procedures`, `culture`, `elevage`…) et vers ses photos. Il applique ensuite à chaque fiche valide les règles de `outils/regles.mjs`, celles qu'un schéma n'exprime pas seul : deux plages d'un même paramètre ne se chevauchent pas et leur minimum ne dépasse pas leur maximum ; les phases d'un mode couvrent les douze mois, et un mode n'est défini qu'une fois par fiche ; le `mode` d'un élevage existe dans sa fiche animal ; `elevage_parent` est présent si et seulement si l'origine est `souche` ; une espèce désigne une famille de son règne ; l'`id` d'un élevage commence par l'année de son début ; un élevage terminé ou perdu a une fin, un élevage en cours n'en a pas. Il rend une liste de défauts, un par fiche fautive : une fiche invalide n'est pas signalée une seconde fois sur celles qui la citent.
- `outils/verifier-lfs.mjs` lit l'index Git, et non la copie de travail, pour l'INV-3 : une photo bien rangée y est un pointeur, que LFS ait téléchargé l'image ou non.

## Une photo postée depuis le site

Le site [skarden-web](https://github.com/ssk-it/skarden-web) écrit dans ce dépôt pour y poster des photos, et seulement par une branche (cadrage [skarden-cadrage#2026-006](https://ssk-canon.s3-website.fr-par.scw.cloud/ssk-it/skarden-cadrage/cadrages/2026-006), `ADR-photos-postees-par-une-branche`). L'API LFS de GitHub refuse la prévolée du navigateur : le site ne peut pas déposer un objet LFS, et commite donc la photo telle quelle, par l'API REST. Le chemin :

1. Le site crée un commit sur une branche `photos/<fichier de la fiche>-<instant>`, partie de la tête de `main` : les photos sous `medias/`, leurs chemins ajoutés au champ `photos` de la fiche.
2. La poussée déclenche [`photos-en-lfs.yml`](../.github/workflows/photos-en-lfs.yml). Il lance `outils/photos-en-lfs.mjs`, qui réécrit les commits de la branche absents de `origin/main` par `git lfs migrate import --fixup`, puis repousse la branche avec `--force-with-lease` : la seule écriture du workflow, avec `contents: write` au niveau du job. `--fixup` convertit ce que `.gitattributes` désigne, sans modifier ce fichier — `--include="medias/**"` y ajouterait une ligne, que la demande de fusion ferait entrer dans `main`. Une branche qui ne porte déjà que des pointeurs n'est pas repoussée. La poussée faite avec le jeton des Actions ne déclenche aucun workflow : la conversion ne se relance pas sur elle-même.
3. Le site ouvre la demande de fusion sur la branche convertie, et en demande la fusion automatique. Les contrôles de `controles.yml`, dont `pnpm verifier:lfs`, portent sur les commits convertis : une photo brute n'atteint jamais `main` (INV-3).

**Ce que le site lit pour savoir que la conversion est terminée.** Le run de `photos-en-lfs.yml` déclenché par sa poussée, qui porte pour `head_sha` le commit que le site a créé :

```
GET /repos/{owner}/{repo}/actions/workflows/photos-en-lfs.yml/runs?event=push&branch=<branche>&head_sha=<commit créé par le site>
```

- **Aucun run** : GitHub ne l'a pas encore créé, quelques secondes après la poussée. Relire.
- **`status` différent de `completed`** : la conversion tourne.
- **`conclusion` à `success`** : la branche est convertie. Sa tête, lue par `GET /repos/{owner}/{repo}/git/ref/heads/<branche>`, est le commit sur lequel ouvrir la demande de fusion. Elle est restée le commit du site s'il n'y avait rien à convertir.
- **toute autre `conclusion`** : la conversion a échoué — quota LFS atteint, branche avancée entretemps. Le site le dit avec le `html_url` du run, et la branche reste en place.

Une branche mise à jour plus tard, par une fusion de `main` que demande la règle de la branche à jour, relance la conversion : elle n'a rien à convertir, et ne repousse rien.

## Faire évoluer le format

Un champ, une valeur autorisée ou une collection est une décision de format : elle se cadre d'abord dans [ssk-it/skarden-cadrage](https://github.com/ssk-it/skarden-cadrage). Puis, dans une même demande de fusion :

1. le schéma de `schemas/` et, pour une collection ou un lien, `referentiel.yml` ;
2. le modèle de `modeles/`, que les tests éprouvent ;
3. un test qui échoue sans le changement ;
4. les fiches existantes, mises en conformité — `pnpm verifier` doit rester vert.

Un champ ajouté reste facultatif tant que des fiches existent sans lui. Le renommer, c'est réécrire toutes les fiches : y regarder à deux fois (INV-2).

## Les tests

Le lanceur de Node (`node --test`), sans dépendance de test. Ceux de la conversion des photos postées depuis le site (`tests/photos-en-lfs.test.mjs`) demandent `git-lfs`, installé sur les runners de GitHub. Chaque test des vérificateurs fabrique un référentiel jetable dans un dossier temporaire, peuplé des modèles et des fiches de `tests/fixtures/` que les modèles désignent — tirées du guide d'élevage d'escargots, et, pour les transformations, la variante de la liqueur d'hibiscus et sa dégustation —, puis y introduit un seul défaut et vérifie qu'il est signalé une fois, sur la bonne fiche. Test rouge d'abord : un test qui n'a jamais échoué n'a rien prouvé.

## Le cycle de livraison

Une copie liée par sujet, une branche, une demande de fusion vers `main` : les contrôles doivent passer. La branche distante disparaît à la fusion. Il n'y a pas de version publiée : `main` est le référentiel.
