# Skarden

Que faut-il à chacune de mes plantes et de mes bêtes, et qu'ai-je appris en les cultivant ou en les élevant ?

Ce dépôt est le référentiel de Skarden : une fiche Markdown à frontmatter YAML pour tout ce qui vit chez moi, végétal ou animal, sur un même patron.

- **Une espèce** dit ce qu'elle demande, partout et toujours : une plante (`plantes/`) ou un animal (`animaux/`), rangés par famille (`familles/`).
- **Un lot** dit ce qui a réellement vécu chez moi, sur une période : une culture (`cultures/`) ou un élevage (`elevages/`).
- **Une installation** (`installations/`) décrit le contenant qui abrite un élevage — un aquarium, un terrarium, un bac —, et **un emplacement** (`emplacements/`) l'endroit où il se trouve.
- **Une procédure** (`procedures/`) décrit une préparation réutilisable, que les espèces citent.
- **Le journal** (`journal/`) date les événements d'une culture ou d'un élevage.

Les photos vivent dans `medias/`, en Git LFS.

L'interface de présentation et de parcours, [ssk-it/skarden-web](https://github.com/ssk-it/skarden-web), lit ce dépôt sans en être la source. Les décisions de format se prennent dans le référentiel de cadrage [ssk-it/skarden-cadrage](https://github.com/ssk-it/skarden-cadrage).

## Ajouter une fiche

Copier le modèle de la collection depuis `modeles/`, le ranger dans son dossier sous le nom de son `id`, puis vérifier :

```bash
pnpm install
pnpm verifier
```

La documentation technique commence à [docs/README.md](docs/README.md).
