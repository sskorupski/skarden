# Développement

## L'arborescence

```
referentiel.yml        les collections : dossier, schéma, liens entre fiches — lu par le vérificateur et par l'interface
schemas/               un schéma JSON (draft 2020-12) par collection, pour le frontmatter, et socle.schema.json qu'ils reprennent par $ref
modeles/               une fiche exemple par collection, à copier ; les tests les éprouvent
familles/              une fiche par famille, de règne végétal ou animal
plantes/               une fiche par plante : ce qu'elle demande
animaux/               une fiche par espèce animale : ce qu'elle demande
emplacements/          une fiche par endroit de la maison
installations/         une fiche par contenant : aquarium, terrarium, bac, dans un emplacement
procedures/            une fiche par préparation réutilisable, citée par les espèces
cultures/              une fiche par culture menée : une plante, un emplacement, une période
elevages/              une fiche par élevage mené : un animal, une installation, une période
journal/AAAA/          une entrée par événement daté d'une culture ou d'un élevage, rangée par année
medias/                les photos, en Git LFS (INV-3)
outils/                verifier.mjs et regles.mjs, verifier-lfs.mjs, photos-en-lfs.mjs, et le script de mise en place GitHub
tests/                 les tests des outils, avec le lanceur de Node ; fixtures/ tient les fiches que les modèles désignent
```

## Les gestes courants

| Commande | Ce qu'elle fait |
| --- | --- |
| `pnpm install` | Installe `ajv` et `yaml`, d'après `pnpm-lock.yaml` |
| `pnpm verifier` | Chaque fiche a un frontmatter conforme à son schéma, porte le nom de son `id`, ne désigne que des fiches et des photos qui existent, et respecte les règles de `outils/regles.mjs` |
| `pnpm verifier:lfs` | Chaque fichier de `medias/` est entré dans l'index comme un pointeur Git LFS |
| `pnpm test` | Les tests des deux vérificateurs et de la conversion des photos postées depuis le site |

## Ajouter une fiche

1. Copier le modèle de la collection depuis `modeles/`.
2. Le ranger dans le dossier de la collection, sous le nom de son `id` : `plantes/basilic-grand-vert.md`. Une entrée du journal n'a pas d'`id` : elle se range dans le dossier de son année et se nomme d'après sa date, `journal/2026/2026-05-02-basilic-rempotage.md`.
3. Une photo se range sous `medias/` et se cite depuis la fiche par son chemin depuis la racine : `photos: [medias/plantes/basilic.jpg]`.
4. `pnpm verifier`.

Une fiche désigne les autres par leur `id` : écrire d'abord celles qu'elle désigne. Pour un élevage, la famille, l'animal, les procédures qu'il cite, l'emplacement et l'installation viennent avant la fiche élevage, et le `mode` de l'élevage se choisit parmi ceux de l'animal.

## Ajouter une photo depuis le site

Depuis la page d'une fiche, sur [skarden-web](https://github.com/ssk-it/skarden-web), avec un jeton d'écriture pour ce dépôt : le site range la photo sous `medias/<collection>/`, l'ajoute au champ `photos` de la fiche, et commite le tout sur une branche `photos/<fichier>-<instant>` partie de `main`. Le navigateur ne peut pas déposer un objet LFS : la photo arrive telle quelle, et l'Action [`photos-en-lfs.yml`](../.github/workflows/photos-en-lfs.yml) la convertit en pointeur et repousse la branche. Le site ouvre ensuite la demande de fusion, que les contrôles vérifient comme toute autre, et en demande la fusion automatique. Le détail, et ce que le site lit pour savoir où en est la conversion : [pratiques.md](pratiques.md#une-photo-postée-depuis-le-site).

L'envoi dépend de deux réglages du dépôt que rien n'y montre, Git LFS actif et la fusion automatique permise. `bash outils/mise-en-place-github.sh` les pose, chaque écriture confirmée, et les vérifie de l'extérieur.

Rien à faire sur un poste. Une branche `photos/…` qui reste ouverte est un envoi arrêté : le lien de son Action dit pourquoi.

## Les pièges

- **Git LFS doit être installé avant le premier clone ou le premier ajout de photo** (`brew install git-lfs`, puis `git lfs install`). Sans lui, une photo ajoutée entre telle quelle dans l'historique, et `pnpm verifier:lfs` le signale — mais l'historique local la garde déjà : la retirer du commit avant de pousser.
- **Une extension absente de `.gitattributes` n'est pas filtrée par LFS.** L'ajouter là avant d'ajouter la photo. La conversion des photos postées depuis le site lit la même liste : elle ne convertit pas une extension qui n'y est pas.
- **pnpm, jamais npm** : la version est fixée par `packageManager` dans `package.json`, Node par `.nvmrc`.
