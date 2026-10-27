// Vérifie le référentiel : chaque fiche a un frontmatter conforme au schéma de
// sa collection, porte le nom de son id, ne désigne que des fiches et des
// photos qui existent, et respecte les règles que son schéma n'exprime pas.
// Rend la liste des défauts ; vide, le référentiel est sain.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { parse } from 'yaml';
import { REGLES } from './regles.mjs';

export function verifier(racine) {
  const config = parse(readFileSync(join(racine, 'referentiel.yml'), 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, verbose: true });
  ajouterLesSchemas(ajv, racine, Object.values(config.collections));
  const defauts = [];
  const fiches = {};
  // Une fiche se désigne par le nom de son fichier, valide ou non : un défaut
  // ne se signale qu'une fois, sur la fiche fautive, pas sur celles qui la citent.
  const ids = {};

  for (const [nom, collection] of Object.entries(config.collections)) {
    const valider = ajv.getSchema(JSON.parse(readFileSync(join(racine, collection.schema), 'utf8')).$id);
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
        messagesDeSchema(valider.errors).forEach(signaler);
        continue;
      }
      if (collection.par_annee) verifierRangementAnnuel(fichier, donnees, signaler);
      else if (donnees.id !== basename(chemin, '.md')) {
        signaler(`id « ${donnees.id} » différent du nom du fichier.`);
      }
      fiches[nom].push({ donnees, signaler });
    }
  }

  // Les fiches valides de chaque collection, par id, pour les règles qui lisent
  // la fiche désignée : le règne d'une famille, les modes d'un animal.
  const valides = Object.fromEntries(Object.entries(fiches).map(
    ([nom, liste]) => [nom, new Map(liste.map(({ donnees }) => [donnees.id, donnees]))],
  ));

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
      for (const regle of REGLES[nom] ?? []) regle(donnees, valides).forEach(signaler);
    }
  }
  return defauts;
}

// Un schéma en reprend d'autres par `$ref`, le socle d'abord : tous ceux des
// dossiers de schémas sont connus d'Ajv avant qu'on en demande un.
function ajouterLesSchemas(ajv, racine, collections) {
  for (const dossier of new Set(collections.map((collection) => dirname(collection.schema)))) {
    for (const nom of readdirSync(join(racine, dossier)).filter((nom) => nom.endsWith('.schema.json')).sort()) {
      ajv.addSchema(JSON.parse(readFileSync(join(racine, dossier, nom), 'utf8')));
    }
  }
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

// Un choix entre champs (`oneOf` ou `anyOf` dont chaque branche n'exige qu'un
// champ) se dit en une phrase : l'échec de chacune de ses branches se tait.
function messagesDeSchema(erreurs) {
  const choix = erreurs.filter(estUnChoixDeChamps).map((erreur) => erreur.schemaPath);
  return erreurs
    .filter((erreur) => erreur.keyword !== 'if')
    .filter((erreur) => !choix.some((chemin) => erreur.schemaPath.startsWith(`${chemin}/`)))
    .map(messageDeSchema);
}

function estUnChoixDeChamps(erreur) {
  return ['oneOf', 'anyOf'].includes(erreur.keyword)
    && erreur.schema.every((branche) => Object.keys(branche).length === 1 && branche.required?.length === 1);
}

function messageDeSchema(erreur) {
  const champ = erreur.instancePath.slice(1).replaceAll('/', '.') || 'frontmatter';
  if (estUnChoixDeChamps(erreur)) {
    const champs = erreur.schema.map((branche) => branche.required[0]).join(', ');
    return `${champ} : porte ${erreur.keyword === 'oneOf' ? 'exactement' : 'au moins'} un des champs ${champs}.`;
  }
  if (erreur.keyword === 'not' && erreur.parentSchema.description) return `${champ} : ${erreur.parentSchema.description}`;
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
