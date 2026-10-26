# Skarden

Que faut-il à chacune de mes plantes, et qu'ai-je appris en les cultivant ?

Ce dépôt est le référentiel de Skarden : une fiche Markdown à frontmatter YAML par famille botanique, par plante — ce qu'elle demande —, par emplacement — où ça pousse chez moi —, par culture — une plante réellement menée, à un endroit, sur une période —, et un journal daté de ce qui s'y est passé. Les photos vivent dans `medias/`, en Git LFS.

L'interface de présentation et de parcours, [ssk-it/skarden-web](https://github.com/ssk-it/skarden-web), lit ce dépôt sans en être la source. Les décisions de format se prennent dans le référentiel de cadrage [ssk-it/skarden-cadrage](https://github.com/ssk-it/skarden-cadrage).

## Ajouter une fiche

Copier le modèle de la collection depuis `modeles/`, le ranger dans son dossier sous le nom de son `id`, puis vérifier :

```bash
pnpm install
pnpm verifier
```

La documentation technique commence à [docs/README.md](docs/README.md).
