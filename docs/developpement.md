# Développement

## L'arborescence

```
referentiel.yml        les collections : dossier, schéma, liens entre fiches — lu par le vérificateur et par l'interface
schemas/               un schéma JSON (draft 2020-12) par collection, pour le frontmatter
modeles/               une fiche exemple par collection, à copier ; les tests les éprouvent
familles/              une fiche par famille botanique
plantes/               une fiche par plante : ce qu'elle demande
emplacements/          une fiche par endroit où ça pousse
cultures/              une fiche par culture menée : une plante, un emplacement, une période
journal/AAAA/          une entrée par événement daté, rangée par année
medias/                les photos, en Git LFS (INV-3)
outils/                verifier.mjs, verifier-lfs.mjs, et le script de mise en place GitHub
tests/                 les tests des outils, avec le lanceur de Node
```

## Les gestes courants

| Commande | Ce qu'elle fait |
| --- | --- |
| `pnpm install` | Installe `ajv` et `yaml`, d'après `pnpm-lock.yaml` |
| `pnpm verifier` | Chaque fiche a un frontmatter conforme à son schéma, porte le nom de son `id`, ne désigne que des fiches et des photos qui existent |
| `pnpm verifier:lfs` | Chaque fichier de `medias/` est entré dans l'index comme un pointeur Git LFS |
| `pnpm test` | Les tests des deux vérificateurs |

## Ajouter une fiche

1. Copier le modèle de la collection depuis `modeles/`.
2. Le ranger dans le dossier de la collection, sous le nom de son `id` : `plantes/basilic-grand-vert.md`. Une entrée du journal n'a pas d'`id` : elle se range dans le dossier de son année et se nomme d'après sa date, `journal/2026/2026-05-02-basilic-rempotage.md`.
3. Une photo se range sous `medias/` et se cite depuis la fiche par son chemin depuis la racine : `photos: [medias/plantes/basilic.jpg]`.
4. `pnpm verifier`.

## Les pièges

- **Git LFS doit être installé avant le premier clone ou le premier ajout de photo** (`brew install git-lfs`, puis `git lfs install`). Sans lui, une photo ajoutée entre telle quelle dans l'historique, et `pnpm verifier:lfs` le signale — mais l'historique local la garde déjà : la retirer du commit avant de pousser.
- **Une extension absente de `.gitattributes` n'est pas filtrée par LFS.** L'ajouter là avant d'ajouter la photo.
- **pnpm, jamais npm** : la version est fixée par `packageManager` dans `package.json`, Node par `.nvmrc`.
