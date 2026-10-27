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

// Un référentiel jetable, peuplé des modèles rangés là où ils vivraient, et des
// fiches tirées du guide d'élevage d'escargots que les modèles désignent.
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
  cpSync(join(DEPOT, 'tests', 'fixtures', 'escargots'), racine, { recursive: true });
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

test("un aliment qui ne mène à aucune plante est signalé", () => {
  const racine = referentielDesModeles();
  remplacer(racine, ANIMAL, 'plantes: []', 'plantes: [salade]');
  unSeulDefaut(racine, ANIMAL, /aliments\.plantes.*salade/);
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
  unSeulDefaut(racine, DORMANCE, /culture, elevage/);
});

test('une entrée du journal qui ne désigne aucun lot est signalée', () => {
  const racine = referentielDesModeles();
  remplacer(racine, DORMANCE, 'elevage: 2026-petit-gris-garage\n', '');
  unSeulDefaut(racine, DORMANCE, /culture, elevage/);
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
