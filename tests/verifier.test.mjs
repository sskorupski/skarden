import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifier } from '../outils/verifier.mjs';

const DEPOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Un référentiel jetable, peuplé des modèles rangés là où ils vivraient.
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
