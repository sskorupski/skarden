import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertirEnLfs } from '../outils/photos-en-lfs.mjs';
import { photosHorsLfs } from '../outils/verifier-lfs.mjs';

const RACINE_DU_DEPOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IDENTITE = ['-c', 'user.name=Essai', '-c', 'user.email=essai@exemple.invalid'];
// Ce que fait l'API REST : le fichier entre tel quel, aucun filtre LFS ne passe.
const SANS_LFS = ['-c', 'filter.lfs.clean=', '-c', 'filter.lfs.smudge=', '-c', 'filter.lfs.process=', '-c', 'filter.lfs.required=false'];
const JPEG_BRUT = '\xff\xd8\xff\xe0 une photo brute';
const POINTEUR = 'version https://git-lfs.github.com/spec/v1\noid sha256:' + '0'.repeat(64) + '\nsize 12\n';

// Une copie sortie ne télécharge pas d'objet LFS, comme celle de l'Action.
const ENV = { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' };
const git = (cwd, ...args) =>
  execFileSync('git', [...IDENTITE, ...args], { cwd, env: ENV, encoding: 'latin1', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function ecrire(racine, fichiers) {
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(racine, chemin)), { recursive: true });
    writeFileSync(join(racine, chemin), contenu, 'latin1');
  }
}

// Un dépôt distant nu, dont main porte le .gitattributes du référentiel, et une
// branche photos/… poussée comme le fait le site : un commit, la photo brute.
function depotAvecBranche(branche, fichiers) {
  const base = mkdtempSync(join(tmpdir(), 'skarden-photos-'));
  const origine = join(base, 'origine.git');
  const poste = join(base, 'poste');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origine]);
  git(base, ...SANS_LFS, 'clone', '-q', origine, poste);
  git(poste, 'checkout', '-q', '-b', 'main');
  copyFileSync(join(RACINE_DU_DEPOT, '.gitattributes'), join(poste, '.gitattributes'));
  ecrire(poste, { 'medias/.gitkeep': '', 'plantes/basilic.md': '---\nid: basilic\n---\n' });
  git(poste, 'add', '-A');
  git(poste, 'commit', '-q', '-m', 'Référentiel');
  git(poste, 'push', '-q', '--no-verify', 'origin', 'main');
  git(poste, 'checkout', '-q', '-b', branche);
  ecrire(poste, fichiers);
  git(poste, ...SANS_LFS, 'add', '-A');
  git(poste, 'commit', '-q', '-m', 'Ajouter une photo');
  git(poste, 'push', '-q', '--no-verify', 'origin', branche);

  // La copie que prend l'Action : toute l'histoire, la branche sortie.
  const action = join(base, 'action');
  git(base, 'clone', '-q', '--branch', branche, origine, action);
  return { origine, action, poussee: git(poste, 'rev-parse', 'HEAD') };
}

const tete = (origine, branche) => git(origine, 'rev-parse', `refs/heads/${branche}`);

test('une photo brute sur une branche photos/… devient un pointeur LFS, et la branche est repoussée', () => {
  const branche = 'photos/basilic-20261104-1432';
  const { origine, action, poussee } = depotAvecBranche(branche, {
    'medias/plantes/basilic-20261104-1432-1.jpg': JPEG_BRUT,
    'plantes/basilic.md': '---\nid: basilic\nphotos: [medias/plantes/basilic-20261104-1432-1.jpg]\n---\n',
  });

  const resultat = convertirEnLfs(action, branche);

  assert.equal(resultat.converti, true);
  assert.equal(resultat.avant, poussee);
  assert.equal(tete(origine, branche), resultat.apres);
  assert.notEqual(resultat.apres, poussee);
  assert.deepEqual(photosHorsLfs(action), []);
  // L'objet est parti avec la branche : le crochet de LFS l'a envoyé à la poussée.
  const oid = createHash('sha256').update(Buffer.from(JPEG_BRUT, 'latin1')).digest('hex');
  assert.ok(existsSync(join(origine, 'lfs', 'objects', oid.slice(0, 2), oid.slice(2, 4), oid)));
});

test('la conversion ne touche ni main, ni .gitattributes, ni le reste du commit', () => {
  const branche = 'photos/basilic-20261104-1433';
  const fiche = '---\nid: basilic\nphotos: [medias/plantes/basilic-20261104-1433-1.jpg]\n---\n';
  const { origine, action } = depotAvecBranche(branche, {
    'medias/plantes/basilic-20261104-1433-1.jpg': JPEG_BRUT,
    'plantes/basilic.md': fiche,
  });
  const main = git(origine, 'rev-parse', 'refs/heads/main');

  convertirEnLfs(action, branche);

  assert.equal(git(origine, 'rev-parse', 'refs/heads/main'), main);
  assert.equal(git(origine, 'rev-parse', `${branche}~1`), main);
  assert.equal(git(origine, 'diff', '--name-only', main, branche, '--', '.gitattributes'), '');
  assert.equal(git(origine, 'show', `${branche}:plantes/basilic.md`) + '\n', fiche);
  assert.equal(git(origine, 'log', '-1', '--format=%s', branche), 'Ajouter une photo');
});

test('une branche qui ne porte déjà que des pointeurs n’est pas repoussée', () => {
  const branche = 'photos/basilic-20261104-1434';
  const { origine, action, poussee } = depotAvecBranche(branche, { 'medias/plantes/basilic-20261104-1434-1.jpg': POINTEUR });
  assert.deepEqual(photosHorsLfs(action), []);

  const resultat = convertirEnLfs(action, branche);

  assert.deepEqual(resultat, { converti: false, avant: poussee, apres: poussee });
  assert.equal(tete(origine, branche), poussee);
});

test('une branche que le site a fait avancer entretemps n’est pas écrasée', () => {
  const branche = 'photos/basilic-20261104-1435';
  const { origine, action } = depotAvecBranche(branche, { 'medias/plantes/basilic-20261104-1435-1.jpg': JPEG_BRUT });
  const ailleurs = join(dirname(origine), 'ailleurs');
  git(dirname(origine), ...SANS_LFS, 'clone', '-q', '--branch', branche, origine, ailleurs);
  ecrire(ailleurs, { 'plantes/basilic.md': '---\nid: basilic\n---\n\nUne ligne de plus.\n' });
  git(ailleurs, ...SANS_LFS, 'commit', '-q', '-am', 'Entretemps');
  git(ailleurs, 'push', '-q', '--no-verify', 'origin', branche);
  const avancee = tete(origine, branche);

  assert.throws(() => convertirEnLfs(action, branche));
  assert.equal(tete(origine, branche), avancee);
});
