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
recettes/              une fiche par recette : ce qu'une préparation demande ; une variante est une recette qui désigne sa source par derive_de
realisations/          une fiche par réalisation : ce qui a réellement été fait, un jour donné, en suivant une recette
produits/              une fiche par matière première achetée
contenants/            une fiche par modèle de bocal, de bouteille ou de fût, possédé en un ou plusieurs exemplaires
journal/AAAA/          une entrée par événement daté d'une culture, d'un élevage ou d'une réalisation, rangée par année
medias/                les photos, en Git LFS (INV-3)
outils/                verifier.mjs et regles.mjs, verifier-lfs.mjs, photos-en-lfs.mjs, et le script de mise en place GitHub
tests/                 les tests des outils, avec le lanceur de Node ; fixtures/ tient les fiches que les modèles désignent, et le jeu d'exemple des transformations
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

## Tenir une transformation

Les quatre collections `recettes/`, `realisations/`, `produits/` et `contenants/` sont facultatives, mais se déclarent ensemble dans `referentiel.yml`. Le jeu d'exemple complet — la recette `liqueur-hibiscus`, sa variante, une réalisation en cours et sa dégustation, le produit et le contenant — est dans `modeles/` et `tests/fixtures/transformations/`.

### Créer une recette

Copier `modeles/recette.md` dans `recettes/<id>.md`, avec `version: 1`. Chaque ingrédient porte `ingredient`, un nom libre en kebab-case et unique dans la recette, `quantite` et `unite` (`g`, `kg`, `ml`, `cl`, `l`, `piece`, `pincee`, `cac`, `cas`). Son état va dans `conservation` (`frais`, `seche`, `congele`), jamais dans son nom : `hibiscus` avec `conservation: seche`, et non `hibiscus-seche`. Les phases s'écrivent dans l'ordre d'exécution, chacune avec un `id` unique et un `libelle` ; `duree_cible` et `temperature_c` sont des plages `{ min, max }`, les durées en ISO 8601 (`P3D`, `PT12H`, `P2W`), une valeur unique avec `min` égal à `max`. Le corps dit le principe, les conseils et les pièges.

La `version` augmente de 1 à chaque changement des ingrédients, de leurs quantités ou des phases ; une correction de texte ne la change pas.

### Créer une variante

Une variante est une recette complète : copier la recette dont elle part, lui donner son propre `id` et `version: 1`, ajouter `derive_de: <id de la recette source>`, puis changer ce qui doit l'être. Elle redonne tous ses ingrédients et toutes ses phases, et pas seulement ce qui change. Une variante peut avoir ses propres variantes ; le vérificateur refuse une chaîne de `derive_de` qui revient à la recette de départ.

### Créer une réalisation

Écrire d'abord les fiches qu'elle désigne : la recette, les produits achetés, les contenants, les cultures d'où viennent les récoltes. Puis copier `modeles/realisation.md` dans `realisations/<id>.md`. L'`id` commence par la date du début, `2026-11-07-liqueur-hibiscus-gingembre` ; `debut` et `fin` sont des dates, ou des dates avec heure (`2026-11-07T18:30`), à l'heure de Paris.

- `recette` et `recette_version`, la version suivie, qui ne dépasse pas celle de la recette.
- Les ingrédients réellement employés, recopiés : un ingrédient absent de la recette porte `ajoute: true`. Chacun a au plus une provenance — `produit` (avec `lot`, `dluo`, `achat`) s'il a été acheté, `culture` (avec `recolte`, la date de cueillette) s'il vient de chez moi — ou aucune, pour l'eau du robinet.
- Les phases réellement faites, chacune avec son `id` et son `debut`, puis sa `fin` quand elle s'achève ; une phase absente de la recette porte `ajoutee: true`. `contenant`, `nombre`, `temperature_c` (avec `mesure`) et `conditions` disent où et comment. La durée ne s'écrit jamais : elle se calcule.
- `statut: en-cours` et `fin: null` tant qu'elle dure ; à la fin, `statut: terminee` (ou `perdue`), la `fin` et le `resultat`.
- `ecarts`, les écarts voulus ou subis, et leur raison.

### Ajouter une note au journal

Ce qu'on observe, goûte ou corrige après coup ne s'écrit pas sur la réalisation : c'est une entrée du journal, `journal/AAAA/AAAA-MM-JJ-<réalisation>-<événement>.md`, qui porte `realisation: <id>` et un `evenement` parmi `observation`, `degustation`, `incident`, `ajustement` et `fin-de-phase`.

```yaml
---
date: 2026-11-09
realisation: 2026-11-07-liqueur-hibiscus-gingembre
evenement: observation
---
```

Une dégustation est une séance : une seule entrée, qui porte `avis`, un avis par participant. Chaque avis a un `participant` — un prénom ou un pseudonyme qu'il accepte de voir dans un dépôt public —, des `criteres` notés de 0 à 10 parmi `couleur`, `limpidite`, `nez`, `bouche`, `texture`, `equilibre`, `finale` et `ensemble`, et un `commentaire` facultatif. Seuls les critères jugés se notent. Le délai depuis la fin ne s'écrit pas : le site le calcule. Ce qui s'est dit à plusieurs voix va dans le corps de l'entrée.

```yaml
---
date: 2026-12-10
realisation: 2026-11-07-liqueur-hibiscus-gingembre
evenement: degustation
avis:
  - participant: Camille
    criteres: { couleur: 9, nez: 7, bouche: 6 }
    commentaire: Le gingembre domine encore.
  - participant: Sam
    criteres: { couleur: 8, bouche: 7, equilibre: 6 }
---
```

Une fin de phase se note deux fois, et les deux disent la même date : `fin` sur la phase de la réalisation, et une entrée `fin-de-phase` qui nomme la `phase` close, datée du jour de cette fin. La vérification refuse une entrée dont la phase n'existe pas, est encore sans fin, ou finit un autre jour. Le site l'écrit lui-même quand on déclare la fin depuis la page de la réalisation : un seul commit, sur une branche `phases/<réalisation>-<phase>-<instant>`, sans conversion à attendre, puis une demande de fusion vérifiée comme toute autre.

```yaml
---
date: 2026-11-20
realisation: 2026-11-07-liqueur-hibiscus-gingembre
evenement: fin-de-phase
phase: maceration
---
```

## Ajouter une photo depuis le site

Depuis la page d'une fiche, sur [skarden-web](https://github.com/ssk-it/skarden-web), avec un jeton d'écriture pour ce dépôt : le site range la photo sous `medias/<collection>/`, l'ajoute au champ `photos` de la fiche, et commite le tout sur une branche `photos/<fichier>-<instant>` partie de `main`. Le navigateur ne peut pas déposer un objet LFS : la photo arrive telle quelle, et l'Action [`photos-en-lfs.yml`](../.github/workflows/photos-en-lfs.yml) la convertit en pointeur et repousse la branche. Le site ouvre ensuite la demande de fusion, que les contrôles vérifient comme toute autre, et en demande la fusion automatique. Le détail, et ce que le site lit pour savoir où en est la conversion : [pratiques.md](pratiques.md#une-photo-postée-depuis-le-site).

L'envoi dépend de deux réglages du dépôt que rien n'y montre, Git LFS actif et la fusion automatique permise. `bash outils/mise-en-place-github.sh` permet la fusion automatique, chaque écriture confirmée, et vérifie les deux de l'extérieur. LFS, actif d'office, ne se réactive par l'API que sur un dépôt d'organisation : sur celui d'un compte personnel, comme celui-ci, le script le vérifie seulement.

Rien à faire sur un poste. Une branche `photos/…` qui reste ouverte est un envoi arrêté : le lien de son Action dit pourquoi.

## Les pièges

- **Git LFS doit être installé avant le premier clone ou le premier ajout de photo** (`brew install git-lfs`, puis `git lfs install`). Sans lui, une photo ajoutée entre telle quelle dans l'historique, et `pnpm verifier:lfs` le signale — mais l'historique local la garde déjà : la retirer du commit avant de pousser.
- **Une extension absente de `.gitattributes` n'est pas filtrée par LFS.** L'ajouter là avant d'ajouter la photo. La conversion des photos postées depuis le site lit la même liste : elle ne convertit pas une extension qui n'y est pas.
- **pnpm, jamais npm** : la version est fixée par `packageManager` dans `package.json`, Node par `.nvmrc`.
