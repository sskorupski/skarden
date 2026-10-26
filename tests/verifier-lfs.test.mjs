import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { photosHorsLfs } from '../outils/verifier-lfs.mjs';

const POINTEUR = 'version https://git-lfs.github.com/spec/v1\noid sha256:' + '0'.repeat(64) + '\nsize 12\n';

// Un dépôt git jetable, sans filtre LFS : ce qu'on y ajoute entre tel quel dans l'index.
function depot(fichiers) {
  const racine = mkdtempSync(join(tmpdir(), 'skarden-lfs-'));
  execFileSync('git', ['init', '-q'], { cwd: racine });
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(racine, chemin)), { recursive: true });
    writeFileSync(join(racine, chemin), contenu);
  }
  execFileSync('git', ['add', '-A'], { cwd: racine });
  return racine;
}

test('une photo rangée en pointeur LFS passe', () => {
  assert.deepEqual(photosHorsLfs(depot({ 'medias/plantes/basilic.jpg': POINTEUR })), []);
});

test('une photo entrée telle quelle dans l’historique est signalée', () => {
  const racine = depot({ 'medias/plantes/basilic.jpg': '\xff\xd8\xff\xe0 pas un pointeur' });
  assert.deepEqual(photosHorsLfs(racine), ['medias/plantes/basilic.jpg']);
});

test('une extension oubliée de .gitattributes est signalée aussi', () => {
  const racine = depot({ 'medias/plantes/basilic.gif': 'GIF89a' });
  assert.deepEqual(photosHorsLfs(racine), ['medias/plantes/basilic.gif']);
});

test('le .gitkeep de medias et les fiches hors de medias sont ignorés', () => {
  const racine = depot({ 'medias/.gitkeep': '', 'plantes/basilic.md': '---\nid: basilic\n---\n' });
  assert.deepEqual(photosHorsLfs(racine), []);
});
