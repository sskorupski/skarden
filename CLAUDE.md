# Pour l'agent

Skarden — le référentiel de données : des fiches Markdown à frontmatter YAML, vérifiées par deux outils Node.

## Que lire, et quand

| Avant de… | Lire |
| --- | --- |
| Toucher à un schéma, un champ, une collection | Le référentiel [ssk-it/skarden-cadrage](https://github.com/ssk-it/skarden-cadrage), par le skill `consulter-referentiel`, puis [docs/pratiques.md](docs/pratiques.md#faire-évoluer-le-format) |
| Ajouter une fiche ou une photo | [docs/developpement.md](docs/developpement.md) |
| Toucher à `medias/` ou à `.gitattributes` | [docs/invariants.md](docs/invariants.md) — **obligatoire** |
| Écrire dans `outils/` | [docs/clean-code.md](docs/clean-code.md) |
| Nommer une fiche ou un identifiant | [docs/conventions.md](docs/conventions.md) |

L'index complet : [docs/README.md](docs/README.md).

## Comportement attendu

**Vérifier plutôt que supposer.** `pnpm test`, `pnpm verifier` et `pnpm verifier:lfs` avant d'annoncer quoi que ce soit.

**Test rouge d'abord.** Un test qui n'a jamais échoué n'a rien prouvé.

**Ne pas contourner un invariant.** Les citer par leur numéro (`INV-1`…`INV-3`) ; s'il gêne, le dire.

**Ne jamais inventer une fiche.** Les fiches décrivent les plantes de l'utilisateur : n'en écrire qu'à sa demande, avec ce qu'il dit.

**pnpm, jamais npm.**

**Ne pas committer sur `main`.** Une copie liée par sujet, une demande de fusion.

**Tenir la documentation à jour** dans le même changement : une commande citée dans `docs/` existe dans `package.json`, un renvoi pointe vers un fichier réel.

**Échanges en français.**
