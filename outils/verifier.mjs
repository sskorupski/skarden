// Vérifie le référentiel : chaque fiche a un frontmatter conforme au schéma de
// sa collection, porte le nom de son id, ne désigne que des fiches et des
// photos qui existent. Rend la liste des défauts ; vide, le référentiel est sain.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { parse } from 'yaml';

export function verifier(racine) {
  const config = parse(readFileSync(join(racine, 'referentiel.yml'), 'utf8'));
  const ajv = new Ajv2020({ allErrors: true });
  const defauts = [];
  const fiches = {};
  // Une fiche se désigne par le nom de son fichier, valide ou non : un défaut
  // ne se signale qu'une fois, sur la fiche fautive, pas sur celles qui la citent.
  const ids = {};

  for (const [nom, collection] of Object.entries(config.collections)) {
    const valider = ajv.compile(JSON.parse(readFileSync(join(racine, collection.schema), 'utf8')));
    fiches[nom] = [];
    ids[nom] = new Set();
    for (const chemin of fichiersMarkdown(join(racine, collection.dossier))) {
      ids[nom].add(basename(chemin, '.md'));
      const fichier = relative(racine, chemin).split(sep).join('/');
      const signaler = (message) => defauts.push({ fichier, message });
      const donnees = frontmatter(readFileSync(chemin, 'utf8'));
      if (donnees === undefined) {
        signaler('frontmatter YAML absent : la fiche doit commencer par un bloc « --- ».');
        continue;
      }
      if (!valider(donnees)) {
        valider.errors.filter((e) => e.keyword !== 'if').forEach((e) => signaler(messageDeSchema(e)));
        continue;
      }
      if (collection.par_annee) verifierRangementAnnuel(fichier, donnees, signaler);
      else if (donnees.id !== basename(chemin, '.md')) {
        signaler(`id « ${donnees.id} » différent du nom du fichier.`);
      }
      fiches[nom].push({ donnees, signaler });
    }
  }

  for (const [nom, collection] of Object.entries(config.collections)) {
    for (const { donnees, signaler } of fiches[nom]) {
      for (const [champ, cible] of Object.entries(collection.liens ?? {})) {
        for (const id of [valeurDe(donnees, champ) ?? []].flat()) {
          if (!ids[cible].has(id)) signaler(`${champ} : « ${id} » ne désigne aucune fiche de ${cible}.`);
        }
      }
      for (const photo of donnees.photos ?? []) {
        if (!existsSync(join(racine, photo))) signaler(`photos : « ${photo} » absente du dépôt.`);
      }
    }
  }
  return defauts;
}

function fichiersMarkdown(dossier) {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier, { recursive: true, withFileTypes: true })
    .filter((entree) => entree.isFile() && entree.name.endsWith('.md'))
    .map((entree) => join(entree.parentPath, entree.name))
    .sort();
}

function frontmatter(contenu) {
  const bloc = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(contenu);
  if (!bloc) return undefined;
  const donnees = parse(bloc[1]);
  return donnees !== null && typeof donnees === 'object' ? donnees : undefined;
}

// Une entrée du journal vit dans le dossier de son année et se nomme d'après sa date.
function verifierRangementAnnuel(fichier, donnees, signaler) {
  const segments = fichier.split('/');
  const annee = donnees.date.slice(0, 4);
  if (segments.length !== 3) {
    signaler(`rangée hors d'un dossier d'année : elle va dans ${segments[0]}/${annee}/.`);
  } else if (segments[1] !== annee) {
    signaler(`rangée dans ${segments[1]}/ alors que sa date est de ${annee}.`);
  }
  if (!segments.at(-1).startsWith(`${donnees.date}-`)) {
    signaler(`le nom du fichier doit commencer par sa date, ${donnees.date}-.`);
  }
}

function messageDeSchema(erreur) {
  const champ = erreur.instancePath.slice(1).replaceAll('/', '.') || 'frontmatter';
  if (erreur.keyword === 'additionalProperties') return `champ inconnu : ${erreur.params.additionalProperty}.`;
  if (erreur.keyword === 'required') return `champ requis absent : ${erreur.params.missingProperty}.`;
  if (erreur.keyword === 'enum') return `${champ} : valeur hors de la liste (${erreur.params.allowedValues.join(', ')}).`;
  return `${champ} : ${erreur.message}.`;
}

function valeurDe(objet, chemin) {
  return chemin.split('.').reduce((valeur, cle) => valeur?.[cle], objet);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const defauts = verifier(process.cwd());
  for (const { fichier, message } of defauts) console.error(`${fichier} — ${message}`);
  if (defauts.length > 0) process.exit(1);
  console.log('Référentiel valide.');
}
