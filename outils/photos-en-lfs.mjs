// Convertit en pointeurs Git LFS les photos qu'une branche photos/… porte
// telles quelles (INV-3), puis repousse la branche. Le site y commite la photo
// par l'API REST, l'API LFS refusant le navigateur ; l'Action photos-en-lfs.yml
// lance cet outil sur la copie qu'elle a sortie.
//
// Seuls les commits absents de origin/main sont réécrits. --fixup convertit ce
// que .gitattributes désigne déjà et ne le modifie pas : une extension absente
// de la liste reste brute, et `pnpm verifier:lfs` la refuse.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function convertirEnLfs(racine, branche) {
  const git = (...args) => execFileSync('git', args, { cwd: racine, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
  const ref = `refs/heads/${branche}`;
  const avant = git('rev-parse', ref);

  // Les filtres, et le crochet qui envoie les objets LFS à la poussée.
  git('lfs', 'install', '--local');
  git('lfs', 'migrate', 'import', '--yes', '--fixup', `--include-ref=${ref}`, '--exclude-ref=refs/remotes/origin/main');
  const apres = git('rev-parse', ref);
  if (apres === avant) return { converti: false, avant, apres };

  // Refuse d'écraser un commit poussé après celui qu'on a converti.
  git('push', '--quiet', `--force-with-lease=${ref}:${avant}`, 'origin', `${ref}:${ref}`);
  return { converti: true, avant, apres };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const branche = process.argv[2];
  if (!branche?.startsWith('photos/')) {
    console.error('Usage : node outils/photos-en-lfs.mjs photos/<fichier>-<instant>');
    process.exit(2);
  }
  const { converti, avant, apres } = convertirEnLfs(process.cwd(), branche);
  console.log(converti ? `${branche} convertie en pointeurs LFS : ${avant} → ${apres}.` : `${branche} ne porte déjà que des pointeurs LFS : rien à repousser.`);
}
