// Vérifie que chaque fichier de medias/ entre dans l'index comme un pointeur
// Git LFS, jamais tel quel (INV-3). Lit l'index et non la copie de travail :
// une photo bien rangée y est un pointeur, que LFS ait téléchargé l'image ou non.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ENTETE_POINTEUR = 'version https://git-lfs.github.com/spec/v1\n';

export function photosHorsLfs(racine) {
  const git = (...args) => execFileSync('git', args, { cwd: racine, encoding: 'latin1', maxBuffer: 1 << 30 });
  return git('ls-files', '-s', '-z', '--', 'medias')
    .split('\0')
    .filter(Boolean)
    .map((ligne) => {
      const [entete, chemin] = ligne.split('\t');
      return { objet: entete.split(' ')[1], chemin };
    })
    .filter(({ chemin }) => chemin !== 'medias/.gitkeep')
    .filter(({ objet }) => !git('cat-file', 'blob', objet).startsWith(ENTETE_POINTEUR))
    .map(({ chemin }) => chemin);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fautives = photosHorsLfs(process.cwd());
  for (const chemin of fautives) console.error(`${chemin} — entrée dans l'historique sans passer par Git LFS (INV-3).`);
  if (fautives.length > 0) process.exit(1);
  console.log('Photos toutes en Git LFS.');
}
