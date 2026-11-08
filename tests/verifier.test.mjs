import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifier } from '../outils/verifier.mjs';

const DEPOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ELEVAGE = 'elevages/2026-petit-gris-garage.md';
const ANIMAL = 'animaux/petit-gris.md';
const DORMANCE = 'journal/2026/2026-11-03-petit-gris-mise-en-dormance.md';
const RECETTE = 'recettes/liqueur-hibiscus.md';
const VARIANTE = 'recettes/liqueur-hibiscus-gingembre.md';
const REALISATION = 'realisations/2026-11-07-liqueur-hibiscus-gingembre.md';
const PRODUIT = 'produits/bissap-sachet-500g.md';
const CONTENANT = 'contenants/bocal-parfait-1l.md';
const DEGUSTATION = 'journal/2026/2026-11-10-liqueur-hibiscus-gingembre-degustation.md';

// Un référentiel jetable, peuplé des modèles rangés là où ils vivraient, et des
// fiches que les modèles désignent : celles du guide d'élevage d'escargots, et
// la variante de la liqueur d'hibiscus avec sa dégustation.
function referentielDesModeles() {
  const racine = mkdtempSync(join(tmpdir(), 'skarden-'));
  cpSync(join(DEPOT, 'referentiel.yml'), join(racine, 'referentiel.yml'));
  cpSync(join(DEPOT, 'schemas'), join(racine, 'schemas'), { recursive: true });
  const modele = (nom) => readFileSync(join(DEPOT, 'modeles', `${nom}.md`), 'utf8');
  ecrire(racine, 'familles/lamiacees.md', modele('famille'));
  ecrire(racine, 'plantes/basilic-grand-vert.md', modele('plante'));
  ecrire(racine, 'emplacements/rebord-cuisine.md', modele('emplacement'));
  ecrire(racine, 'cultures/2026-basilic-cuisine.md', modele('culture'));
  ecrire(racine, 'journal/2026/2026-05-02-basilic-rempotage.md', modele('journal'));
  ecrire(racine, ANIMAL, modele('animal'));
  ecrire(racine, 'installations/aquarium-garage.md', modele('installation'));
  ecrire(racine, 'procedures/preparation-substrat-terre.md', modele('procedure'));
  ecrire(racine, ELEVAGE, modele('elevage'));
  ecrire(racine, RECETTE, modele('recette'));
  ecrire(racine, REALISATION, modele('realisation'));
  ecrire(racine, PRODUIT, modele('produit'));
  ecrire(racine, CONTENANT, modele('contenant'));
  cpSync(join(DEPOT, 'tests', 'fixtures', 'escargots'), racine, { recursive: true });
  cpSync(join(DEPOT, 'tests', 'fixtures', 'transformations'), racine, { recursive: true });
  return racine;
}

function ecrire(racine, chemin, contenu) {
  mkdirSync(dirname(join(racine, chemin)), { recursive: true });
  writeFileSync(join(racine, chemin), contenu);
}

function remplacer(racine, chemin, avant, apres) {
  const contenu = readFileSync(join(racine, chemin), 'utf8');
  assert.ok(contenu.includes(avant), `« ${avant} » absent de ${chemin}`);
  writeFileSync(join(racine, chemin), contenu.replace(avant, apres));
}

function unSeulDefaut(racine, fichier, extrait) {
  const defauts = verifier(racine);
  assert.equal(defauts.length, 1, JSON.stringify(defauts, null, 2));
  assert.equal(defauts[0].fichier, fichier);
  assert.match(defauts[0].message, extrait);
}

test('les modèles forment un référentiel valide', () => {
  assert.deepEqual(verifier(referentielDesModeles()), []);
});

test('une fiche sans frontmatter est signalée', () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'familles/solanacees.md', 'Pas de frontmatter.\n');
  unSeulDefaut(racine, 'familles/solanacees.md', /frontmatter/);
});

test('une valeur hors de la liste autorisée est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'plantes/basilic-grand-vert.md', 'type: aromatique', 'type: legumineuse');
  unSeulDefaut(racine, 'plantes/basilic-grand-vert.md', /type/);
});

test("un champ que le schéma ne connaît pas est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'familles/lamiacees.md', 'nom: Lamiacées', 'nom: Lamiacées\ncouleur: verte');
  unSeulDefaut(racine, 'familles/lamiacees.md', /couleur/);
});

test("un id qui n'est pas le nom du fichier est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'emplacements/rebord-cuisine.md', 'id: rebord-cuisine', 'id: rebord-salon');
  unSeulDefaut(racine, 'emplacements/rebord-cuisine.md', /rebord-salon/);
});

test('un lien vers une fiche inexistante est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'cultures/2026-basilic-cuisine.md', 'plante: basilic-grand-vert', 'plante: basilic-pourpre');
  unSeulDefaut(racine, 'cultures/2026-basilic-cuisine.md', /basilic-pourpre/);
});

test('un lien inexistant dans une liste est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'plantes/basilic-grand-vert.md', 'favorables: []', 'favorables: [tomate]');
  unSeulDefaut(racine, 'plantes/basilic-grand-vert.md', /tomate/);
});

test('une culture close sans date de fin est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'cultures/2026-basilic-cuisine.md', 'statut: en-cours', 'statut: terminee');
  unSeulDefaut(racine, 'cultures/2026-basilic-cuisine.md', /fin/);
});

test("une entrée du journal rangée hors de son année est signalée", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'journal/2025/2026-05-03-basilic-taille.md',
    '---\ndate: 2026-05-03\nculture: 2026-basilic-cuisine\nevenement: taille\n---\n');
  unSeulDefaut(racine, 'journal/2025/2026-05-03-basilic-taille.md', /2026/);
});

test("une entrée du journal dont le nom ne commence pas par sa date est signalée", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'journal/2026/basilic-taille.md',
    '---\ndate: 2026-05-03\nculture: 2026-basilic-cuisine\nevenement: taille\n---\n');
  unSeulDefaut(racine, 'journal/2026/basilic-taille.md', /2026-05-03/);
});

test("une entrée du journal posée à la racine du journal est signalée", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'journal/2026-05-03-basilic-taille.md',
    '---\ndate: 2026-05-03\nculture: 2026-basilic-cuisine\nevenement: taille\n---\n');
  unSeulDefaut(racine, 'journal/2026-05-03-basilic-taille.md', /année/);
});

test('une photo absente du dépôt est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'plantes/basilic-grand-vert.md', 'photos: []', 'photos: [medias/basilic.jpg]');
  unSeulDefaut(racine, 'plantes/basilic-grand-vert.md', /medias\/basilic\.jpg/);
});

test('une photo présente dans le dépôt est acceptée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'plantes/basilic-grand-vert.md', 'photos: []', 'photos: [medias/basilic.jpg]');
  ecrire(racine, 'medias/basilic.jpg', '');
  assert.deepEqual(verifier(racine), []);
});

test('une famille sans règne est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'familles/lamiacees.md', 'regne: vegetal\n', '');
  unSeulDefaut(racine, 'familles/lamiacees.md', /regne/);
});

test("une plante d'une famille animale est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'plantes/basilic-grand-vert.md', 'famille: lamiacees', 'famille: helicides');
  unSeulDefaut(racine, 'plantes/basilic-grand-vert.md', /helicides.*animal/);
});

test("un animal d'une famille végétale est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'famille: helicides', 'famille: lamiacees');
  unSeulDefaut(racine, ANIMAL, /lamiacees.*vegetal/);
});

test("un animal sans protection est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'protection: encadree\n', '');
  unSeulDefaut(racine, ANIMAL, /protection/);
});

// L'alimentation s'écrit dans le corps de la fiche (cadrage 2026-003, décision 06) : aucun champ ne la porte.
test("un animal qui porte un champ aliments est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'protection: encadree\n', 'protection: encadree\naliments:\n  plantes: [salade]\n');
  unSeulDefaut(racine, ANIMAL, /aliments/);
});

test("une procédure citée qui n'existe pas est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'procedures: [preparation-substrat-terre]', 'procedures: [eclosion-de-cystes]');
  unSeulDefaut(racine, ANIMAL, /eclosion-de-cystes/);
});

test("une capacité écrite sur une installation est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'installations/aquarium-garage.md', 'type: aquarium', 'type: aquarium\ncapacite: 100');
  unSeulDefaut(racine, 'installations/aquarium-garage.md', /capacite/);
});

test("une installation dont l'emplacement n'existe pas est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'installations/aquarium-garage.md', 'emplacement: garage', 'emplacement: cave');
  unSeulDefaut(racine, 'installations/aquarium-garage.md', /cave/);
});

test('une plage sans aucune borne est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, '{ parametre: humidite-pct, min: 75, max: 90, etat: actif }', '{ parametre: humidite-pct, etat: actif }');
  unSeulDefaut(racine, ANIMAL, /plages\.4.*min, max/);
});

test('une plage dont le minimum dépasse le maximum est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'min: 18, max: 22', 'min: 22, max: 18');
  unSeulDefaut(racine, ANIMAL, /temperature-c.*22.*18.*minimum/);
});

test("deux plages d'un même paramètre qui se chevauchent sont signalées", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'min: 10, max: 12', 'min: 7, max: 12');
  unSeulDefaut(racine, ANIMAL, /temperature-c.*5 à 8.*7 à 12/);
});

test("deux plages qui se touchent sont acceptées, de même qu'un autre paramètre sur les mêmes valeurs", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'min: 10, max: 12', 'min: 8, max: 12');
  remplacer(racine, ANIMAL, 'min: 75, max: 90', 'min: 5, max: 12');
  assert.deepEqual(verifier(racine), []);
});

test('un mode dont les phases laissent des mois sans consigne est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, '{ phase: reveil, mois: [3, 4] }', '{ phase: reveil, mois: [4] }');
  unSeulDefaut(racine, ANIMAL, /hibernation.*\b3\b/);
});

test('un mode défini deux fois dans la même fiche est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'id: activite-continue', 'id: hibernation');
  unSeulDefaut(racine, ANIMAL, /hibernation.*deux fois/);
});

test("un élevage dont le mode n'existe pas dans sa fiche animal est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ELEVAGE, 'mode: hibernation', 'mode: chauffage');
  unSeulDefaut(racine, ELEVAGE, /chauffage.*petit-gris/);
});

test("une souche sans élevage d'origine est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ELEVAGE, 'origine: achat', 'origine: souche');
  unSeulDefaut(racine, ELEVAGE, /elevage_parent.*souche/);
});

test("un élevage d'origine autre que souche qui désigne un élevage parent est signalé", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'elevages/2027-petit-gris-garage.md',
    '---\nid: 2027-petit-gris-garage\nanimal: petit-gris\ninstallation: aquarium-garage\norigine: don\nelevage_parent: 2026-petit-gris-garage\ndebut: 2027-03-01\nstatut: en-cours\n---\n');
  unSeulDefaut(racine, 'elevages/2027-petit-gris-garage.md', /elevage_parent.*don/);
});

test("une souche qui désigne son élevage d'origine est acceptée", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'elevages/2027-petit-gris-garage.md',
    '---\nid: 2027-petit-gris-garage\nanimal: petit-gris\ninstallation: aquarium-garage\norigine: souche\nelevage_parent: 2026-petit-gris-garage\ndebut: 2027-03-01\nstatut: en-cours\n---\n');
  assert.deepEqual(verifier(racine), []);
});

test("un élevage dont l'identifiant ne commence pas par l'année de son début est signalé", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'elevages/2025-petit-gris-garage.md',
    '---\nid: 2025-petit-gris-garage\nanimal: petit-gris\ninstallation: aquarium-garage\norigine: achat\ndebut: 2026-03-01\nstatut: en-cours\n---\n');
  unSeulDefaut(racine, 'elevages/2025-petit-gris-garage.md', /2026-/);
});

for (const statut of ['terminee', 'perdue']) {
  test(`un élevage ${statut} sans date de fin est signalé`, () => {
    const racine = referentielDesModeles();
    remplacer(racine, ELEVAGE, 'statut: en-cours', `statut: ${statut}`);
    unSeulDefaut(racine, ELEVAGE, /fin/);
  });
}

test('un élevage en cours qui a une fin est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, ELEVAGE, 'fin: null', 'fin: 2027-02-01');
  unSeulDefaut(racine, ELEVAGE, /fin/);
});

test('un élevage terminé avec sa date de fin est accepté', () => {
  const racine = referentielDesModeles();
  remplacer(racine, ELEVAGE, 'statut: en-cours', 'statut: terminee');
  remplacer(racine, ELEVAGE, 'fin: null', 'fin: 2027-02-01');
  assert.deepEqual(verifier(racine), []);
});

test('une entrée du journal qui désigne à la fois une culture et un élevage est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DORMANCE, 'elevage: 2026-petit-gris-garage', 'elevage: 2026-petit-gris-garage\nculture: 2026-basilic-cuisine');
  unSeulDefaut(racine, DORMANCE, /culture, elevage, realisation/);
});

test('une entrée du journal qui ne désigne aucun lot est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DORMANCE, 'elevage: 2026-petit-gris-garage\n', '');
  unSeulDefaut(racine, DORMANCE, /culture, elevage, realisation/);
});

test("un événement d'élevage sur une culture est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'journal/2026/2026-05-02-basilic-rempotage.md', 'evenement: rempotage', 'evenement: ponte');
  unSeulDefaut(racine, 'journal/2026/2026-05-02-basilic-rempotage.md', /evenement/);
});

test("un événement de culture sur un élevage est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, DORMANCE, 'evenement: mise-en-dormance', 'evenement: rempotage');
  unSeulDefaut(racine, DORMANCE, /evenement/);
});

test("un effectif sur une entrée de culture est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'journal/2026/2026-05-02-basilic-rempotage.md', 'evenement: rempotage', 'evenement: rempotage\neffectif: 3');
  unSeulDefaut(racine, 'journal/2026/2026-05-02-basilic-rempotage.md', /effectif/);
});

test("une entrée du journal dont l'élevage n'existe pas est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, DORMANCE, 'elevage: 2026-petit-gris-garage', 'elevage: 2026-daphnies-garage');
  unSeulDefaut(racine, DORMANCE, /2026-daphnies-garage/);
});

// Le journal de transformations, cadrage 2026-007.

test('les quatre collections des transformations se déclarent ensemble', () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'referentiel.yml', '  contenants:\n', '  ustensiles:\n');
  unSeulDefaut(racine, 'referentiel.yml', /contenants/);
});

test("une recette d'une catégorie hors de la liste est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'categorie: liqueur', 'categorie: digestif');
  unSeulDefaut(racine, RECETTE, /categorie/);
});

test('une recette sans version est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'version: 1\n', '');
  unSeulDefaut(racine, RECETTE, /version/);
});

test('une recette en version 0 est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'version: 1', 'version: 0');
  unSeulDefaut(racine, RECETTE, /version/);
});

test('une recette sans ingrédients est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, /ingredients:\n(  - .*\n)+/.exec(readFileSync(join(racine, RECETTE), 'utf8'))[0], 'ingredients: []\n');
  unSeulDefaut(racine, RECETTE, /ingredients/);
});

test('une unité hors de la liste est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'quantite: 700, unite: ml', 'quantite: 0.7, unite: L');
  unSeulDefaut(racine, RECETTE, /ingredients\.1\.unite/);
});

test('une quantité nulle est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'quantite: 200, unite: g', 'quantite: 0, unite: g');
  unSeulDefaut(racine, RECETTE, /ingredients\.2\.quantite/);
});

test("une conservation hors de la liste est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'conservation: seche', 'conservation: lyophilise');
  unSeulDefaut(racine, RECETTE, /conservation/);
});

test("un nom d'ingrédient qui n'est pas en kebab-case est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'ingredient: hibiscus,', 'ingredient: Hibiscus séché,');
  unSeulDefaut(racine, RECETTE, /ingredients\.0\.ingredient/);
});

test('deux ingrédients du même nom dans une recette sont signalés', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'ingredient: eau,', 'ingredient: sucre,');
  unSeulDefaut(racine, RECETTE, /sucre.*deux fois/);
});

test('deux phases du même id dans une recette sont signalées', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'id: repos', 'id: filtration');
  unSeulDefaut(racine, RECETTE, /filtration.*deux fois/);
});

test("une durée cible qui n'est pas une durée ISO 8601 est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'min: P3D, max: P5D', 'min: 3 jours, max: P5D');
  unSeulDefaut(racine, RECETTE, /duree_cible\.min/);
});

test('une durée cible dont le minimum dépasse le maximum est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'min: P2W, max: P4W', 'min: P5W, max: P4W');
  unSeulDefaut(racine, RECETTE, /repos.*P5W.*P4W.*minimum/);
});

test('une durée cible se compare toutes unités confondues', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'min: P3D, max: P5D', 'min: PT72H, max: P1W');
  assert.deepEqual(verifier(racine), []);
});

test('une température cible dont le minimum dépasse le maximum est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'min: 18, max: 22', 'min: 22, max: 18');
  unSeulDefaut(racine, RECETTE, /maceration.*22.*18.*minimum/);
});

test("une variante qui dérive d'une recette inexistante est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, VARIANTE, 'derive_de: liqueur-hibiscus', 'derive_de: liqueur-rose');
  unSeulDefaut(racine, VARIANTE, /liqueur-rose/);
});

test("une recette qui dérive d'elle-même est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'version: 1', 'version: 1\nderive_de: liqueur-hibiscus');
  unSeulDefaut(racine, RECETTE, /derive_de.*liqueur-hibiscus/);
});

test('deux recettes qui dérivent l\'une de l\'autre sont signalées chacune', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'version: 1', 'version: 1\nderive_de: liqueur-hibiscus-gingembre');
  const defauts = verifier(racine);
  assert.deepEqual(defauts.map(({ fichier }) => fichier).sort(), [RECETTE, VARIANTE].sort(), JSON.stringify(defauts, null, 2));
  for (const { message } of defauts) assert.match(message, /liqueur-hibiscus → liqueur-hibiscus-gingembre|liqueur-hibiscus-gingembre → liqueur-hibiscus/);
});

test("une variante de variante est acceptée", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'recettes/liqueur-hibiscus-gingembre-piment.md',
    readFileSync(join(racine, VARIANTE), 'utf8')
      .replace('id: liqueur-hibiscus-gingembre', 'id: liqueur-hibiscus-gingembre-piment')
      .replace('derive_de: liqueur-hibiscus', 'derive_de: liqueur-hibiscus-gingembre'));
  assert.deepEqual(verifier(racine), []);
});

test('un produit sans ingrédient est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, PRODUIT, 'ingredient: hibiscus\n', '');
  unSeulDefaut(racine, PRODUIT, /ingredient/);
});

test("une matière de contenant hors de la liste est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, CONTENANT, 'matiere: verre', 'matiere: cristal');
  unSeulDefaut(racine, CONTENANT, /matiere/);
});

test('un contenant sans contenance est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, CONTENANT, 'contenance: { quantite: 1, unite: l }\n', '');
  unSeulDefaut(racine, CONTENANT, /contenance/);
});

test('un contenant qui désigne un emplacement est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, CONTENANT, 'matiere: verre', 'matiere: verre\nemplacement: garage');
  unSeulDefaut(racine, CONTENANT, /emplacement/);
});

test("une réalisation dont l'identifiant ne commence pas par la date de son début est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'debut: 2026-11-07T18:30\nfin', 'debut: 2026-11-06T18:30\nfin');
  unSeulDefaut(racine, REALISATION, /2026-11-06-/);
});

test("un début qui n'est ni une date ni une date avec heure est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'debut: 2026-11-07T18:30\nfin', 'debut: 7 novembre 2026\nfin');
  unSeulDefaut(racine, REALISATION, /debut/);
});

test("une recette invalide n'est signalée que sur elle-même, pas sur ses réalisations", () => {
  const racine = referentielDesModeles();
  remplacer(racine, VARIANTE, 'categorie: liqueur', 'categorie: digestif');
  unSeulDefaut(racine, VARIANTE, /categorie/);
});

test("une réalisation dont la recette n'existe pas est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'recette: liqueur-hibiscus-gingembre', 'recette: liqueur-rose');
  unSeulDefaut(racine, REALISATION, /liqueur-rose/);
});

test('une version de recette plus récente que la recette est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'recette_version: 1', 'recette_version: 2');
  unSeulDefaut(racine, REALISATION, /recette_version.*2.*1/);
});

test("une version antérieure de la recette est acceptée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, VARIANTE, 'version: 1', 'version: 3');
  assert.deepEqual(verifier(racine), []);
});

test("un ingrédient dont le produit n'existe pas est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'produit: bissap-sachet-500g', 'produit: bissap-sachet-1kg');
  unSeulDefaut(racine, REALISATION, /ingredients\.produit.*bissap-sachet-1kg/);
});

test("un ingrédient venu d'une culture est accepté, avec sa date de cueillette", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, '{ ingredient: cannelle,', '{ ingredient: basilic, quantite: 10, unite: g, conservation: frais, culture: 2026-basilic-cuisine, recolte: 2026-11-07, ajoute: true }\n  - { ingredient: cannelle,');
  assert.deepEqual(verifier(racine), []);
});

test("un ingrédient dont la culture n'existe pas est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, '{ ingredient: gingembre, quantite: 25, unite: g, conservation: frais }', '{ ingredient: gingembre, quantite: 25, unite: g, conservation: frais, culture: 2026-gingembre-serre }');
  unSeulDefaut(racine, REALISATION, /ingredients\.culture.*2026-gingembre-serre/);
});

test('un ingrédient à la fois acheté et cueilli est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'produit: bissap-sachet-500g', 'produit: bissap-sachet-500g\n    culture: 2026-basilic-cuisine');
  unSeulDefaut(racine, REALISATION, /hibiscus.*produit.*culture/);
});

test("un lot d'achat sur un ingrédient sans produit est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, '{ ingredient: sucre, quantite: 200, unite: g }', '{ ingredient: sucre, quantite: 200, unite: g, lot: A12 }');
  unSeulDefaut(racine, REALISATION, /ingredients\.2.*produit/);
});

test("un ingrédient absent de la recette est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'ingredient: cannelle,', 'ingredient: canelle,');
  unSeulDefaut(racine, REALISATION, /canelle.*liqueur-hibiscus-gingembre/);
});

test("un ingrédient ajouté à la recette est accepté", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'ingredient: cannelle, quantite: 1, unite: piece, conservation: seche', 'ingredient: vanille, quantite: 1, unite: piece, conservation: seche, ajoute: true');
  assert.deepEqual(verifier(racine), []);
});

test("une phase absente de la recette est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, '  - id: maceration', '  - id: infusion');
  unSeulDefaut(racine, REALISATION, /infusion.*liqueur-hibiscus-gingembre/);
});

test("une phase ajoutée à la recette est acceptée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'ecarts:', '  - { id: clarification, debut: 2026-11-08, ajoutee: true }\necarts:');
  assert.deepEqual(verifier(racine), []);
});

test("une phase dont le contenant n'existe pas est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'contenant: bocal-parfait-1l', 'contenant: bocal-parfait-2l');
  unSeulDefaut(racine, REALISATION, /phases\.contenant.*bocal-parfait-2l/);
});

test('une phase qui finit avant son début est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, '    debut: 2026-11-07T18:30\n', '    debut: 2026-11-07T18:30\n    fin: 2026-11-07T09:00\n');
  unSeulDefaut(racine, REALISATION, /maceration.*2026-11-07T09:00/);
});

test("une phase qui finit le jour de son début, sans heure, est acceptée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, '    debut: 2026-11-07T18:30\n', '    debut: 2026-11-07T18:30\n    fin: 2026-11-07\n');
  assert.deepEqual(verifier(racine), []);
});

test("une durée écrite sur une phase est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, '    nombre: 1\n', '    nombre: 1\n    duree: P4D\n');
  unSeulDefaut(racine, REALISATION, /duree/);
});

test('une température relevée dont le minimum dépasse le maximum est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'min: 19, max: 21', 'min: 21, max: 19');
  unSeulDefaut(racine, REALISATION, /maceration.*21.*19.*minimum/);
});

for (const statut of ['terminee', 'perdue']) {
  test(`une réalisation ${statut} sans fin est signalée`, () => {
    const racine = referentielDesModeles();
    remplacer(racine, REALISATION, 'statut: en-cours', `statut: ${statut}`);
    unSeulDefaut(racine, REALISATION, /fin/);
  });
}

test('une réalisation en cours qui a une fin est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'fin: null', 'fin: 2026-12-01');
  unSeulDefaut(racine, REALISATION, /fin/);
});

test('une réalisation terminée avant son début est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'statut: en-cours', 'statut: terminee');
  remplacer(racine, REALISATION, 'fin: null', 'fin: 2026-11-06');
  unSeulDefaut(racine, REALISATION, /fin.*2026-11-06/);
});

test('une réalisation terminée avec sa fin et son résultat est acceptée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, REALISATION, 'statut: en-cours', 'statut: terminee');
  remplacer(racine, REALISATION, 'fin: null', 'fin: 2026-12-05\nresultat: { volume_obtenu: { quantite: 0.9, unite: l }, degre_estime: 25 }');
  assert.deepEqual(verifier(racine), []);
});

test("une entrée du journal qui désigne à la fois une réalisation et une culture est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'evenement: degustation', 'evenement: degustation\nculture: 2026-basilic-cuisine');
  unSeulDefaut(racine, DEGUSTATION, /exactement un des champs culture, elevage, realisation/);
});

test("une entrée du journal dont la réalisation n'existe pas est signalée", () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'realisation: 2026-11-07-liqueur-hibiscus-gingembre', 'realisation: 2026-11-07-liqueur-rose');
  unSeulDefaut(racine, DEGUSTATION, /2026-11-07-liqueur-rose/);
});

test("un événement de culture sur une réalisation est signalé", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'journal/2026/2026-11-09-liqueur-hibiscus-gingembre-recolte.md',
    '---\ndate: 2026-11-09\nrealisation: 2026-11-07-liqueur-hibiscus-gingembre\nevenement: recolte\n---\n');
  unSeulDefaut(racine, 'journal/2026/2026-11-09-liqueur-hibiscus-gingembre-recolte.md', /evenement/);
});

test("une observation d'une réalisation est acceptée", () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'journal/2026/2026-11-09-liqueur-hibiscus-gingembre-observation.md',
    '---\ndate: 2026-11-09\nrealisation: 2026-11-07-liqueur-hibiscus-gingembre\nevenement: observation\n---\n\nRouge profond dès le deuxième jour.\n');
  assert.deepEqual(verifier(racine), []);
});

test("un effectif sur une entrée de réalisation est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'evenement: degustation', 'evenement: degustation\neffectif: 2');
  unSeulDefaut(racine, DEGUSTATION, /effectif/);
});

test('une dégustation sans avis est signalée', () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'journal/2026/2026-11-09-liqueur-hibiscus-gingembre-degustation.md',
    '---\ndate: 2026-11-09\nrealisation: 2026-11-07-liqueur-hibiscus-gingembre\nevenement: degustation\n---\n');
  unSeulDefaut(racine, 'journal/2026/2026-11-09-liqueur-hibiscus-gingembre-degustation.md', /avis/);
});

test('une dégustation à la liste d\'avis vide est signalée', () => {
  const racine = referentielDesModeles();
  ecrire(racine, 'journal/2026/2026-11-09-liqueur-hibiscus-gingembre-degustation.md',
    '---\ndate: 2026-11-09\nrealisation: 2026-11-07-liqueur-hibiscus-gingembre\nevenement: degustation\navis: []\n---\n');
  unSeulDefaut(racine, 'journal/2026/2026-11-09-liqueur-hibiscus-gingembre-degustation.md', /avis/);
});

test('deux avis du même participant dans une séance sont signalés', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'participant: Sam', 'participant: Camille');
  unSeulDefaut(racine, DEGUSTATION, /Camille.*deux avis/);
});

test('une note au-delà de 10 est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'couleur: 9', 'couleur: 11');
  unSeulDefaut(racine, DEGUSTATION, /avis\.0\.criteres\.couleur/);
});

test('une note négative est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'bouche: 6', 'bouche: -1');
  unSeulDefaut(racine, DEGUSTATION, /avis\.0\.criteres\.bouche/);
});

test('un critère hors de la liste est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'equilibre: 6', 'amertume: 6');
  unSeulDefaut(racine, DEGUSTATION, /amertume/);
});

test('un avis sans aucun critère noté est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, '{ couleur: 8, bouche: 7, equilibre: 6 }', '{}');
  unSeulDefaut(racine, DEGUSTATION, /avis\.1\.criteres/);
});

test('un délai écrit sur une dégustation est signalé', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'evenement: degustation', 'evenement: degustation\ndelai: P3D');
  unSeulDefaut(racine, DEGUSTATION, /delai/);
});

test("des avis sur une observation d'une réalisation sont signalés", () => {
  const racine = referentielDesModeles();
  remplacer(racine, DEGUSTATION, 'evenement: degustation', 'evenement: observation');
  unSeulDefaut(racine, DEGUSTATION, /avis/);
});

test("des avis sur une entrée de culture sont signalés", () => {
  const racine = referentielDesModeles();
  remplacer(racine, 'journal/2026/2026-05-02-basilic-rempotage.md', 'evenement: rempotage', 'evenement: rempotage\navis: [{ participant: Camille, criteres: { nez: 5 } }]');
  unSeulDefaut(racine, 'journal/2026/2026-05-02-basilic-rempotage.md', /avis/);
});

test('une photo absente citée par une recette est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, RECETTE, 'photos: []', 'photos: [medias/recettes/liqueur-hibiscus.jpg]');
  unSeulDefaut(racine, RECETTE, /medias\/recettes\/liqueur-hibiscus\.jpg/);
});
