# Conventions

## Fiches

- **Un `id` en kebab-case, sans accent, égal au nom du fichier** : `basilic-grand-vert`, `rebord-cuisine`. Le vérificateur l'exige.
- **Une culture se préfixe de son année de début** : `2026-basilic-cuisine`. Deux cultures de la même plante au même endroit restent distinctes d'une année à l'autre.
- **Une entrée du journal se nomme d'après sa date**, puis la culture et l'événement : `2026-05-02-basilic-rempotage.md`, dans `journal/2026/`.
- **Les valeurs énumérées sont des mots français en kebab-case, sans accent** (`plein-soleil`, `terminee`) : lisibles en brut (INV-2), stables pour les liens.
- **Les noms de champs du frontmatter sont en français, en snake_case** : `nom_latin`, `temperature_min_c`.

## Code

Le vocabulaire du domaine reste en français — fiche, plante, culture, emplacement, journal, défaut —, y compris dans les identifiants, sans accent. Les commentaires sont en français et disent le pourquoi, jamais le quoi ; ils citent l'invariant (`INV-3`) plutôt que de le reformuler.

## Commits

Impératif présent, en français, une ligne de titre courte ; le corps dit pourquoi, à 72 colonnes.

## Documentation

Les fichiers Markdown ne coupent pas leurs lignes : un paragraphe tient sur une ligne.
