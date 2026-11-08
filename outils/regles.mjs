// Les règles du cadrage qu'un schéma JSON n'exprime pas seul, rangées par
// collection. Chacune lit une fiche déjà conforme à son schéma, et au besoin
// les fiches valides qu'elle désigne ; elle rend ses défauts dans le
// vocabulaire des fiches. Une fiche désignée absente ou invalide est déjà
// signalée ailleurs : la règle se tait.
const MOIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const REGLES = {
  plantes: [familleDuRegne('vegetal')],
  animaux: [familleDuRegne('animal'), plagesSansChevauchement, modesSurDouzeMois],
  elevages: [anneeDuDebut, modeDeLAnimal, elevageParentDUneSouche, finSelonStatut],
  recettes: [derivationSansBoucle, ingredientsUniques, phasesUniques, plagesDeLaRecette],
  realisations: [
    dateDuDebut, finSelonStatut, finApresLeDebut, versionDeLaRecette, uneSeuleProvenance,
    ingredientsDeLaRecette, phasesDeLaRecette, phasesDatees, temperaturesReleveesOrdonnees,
  ],
  journal: [participantsUniques],
};

function familleDuRegne(regne) {
  return (fiche, { familles }) => {
    const famille = familles.get(fiche.famille);
    if (!famille || famille.regne === regne) return [];
    return [`famille : « ${fiche.famille} » est une famille de règne ${famille.regne}, pas ${regne}.`];
  };
}

// Une mesure doit tomber dans une seule plage : deux plages d'un même
// paramètre peuvent se toucher, pas se chevaucher. Une borne absente ouvre la plage.
function plagesSansChevauchement({ plages = [] }) {
  const defauts = [];
  const ordonnees = [];
  for (const plage of plages) {
    if (plage.min > plage.max) {
      defauts.push(`plages : ${plage.parametre} de ${plage.min} à ${plage.max}, le minimum dépasse le maximum.`);
    } else ordonnees.push(plage);
  }
  ordonnees.forEach((a, i) => {
    for (const b of ordonnees.slice(i + 1)) {
      if (a.parametre === b.parametre && seChevauchent(a, b)) {
        defauts.push(`plages : deux plages de ${a.parametre} se chevauchent, ${etendue(a)} et ${etendue(b)}.`);
      }
    }
  });
  return defauts;
}

function seChevauchent(a, b) {
  return (a.min ?? -Infinity) < (b.max ?? Infinity) && (b.min ?? -Infinity) < (a.max ?? Infinity);
}

function etendue({ min, max }) {
  if (min === undefined) return `jusqu'à ${max}`;
  if (max === undefined) return `à partir de ${min}`;
  return `${min} à ${max}`;
}

function modesSurDouzeMois({ modes = [] }) {
  const defauts = [];
  const vus = new Set();
  for (const mode of modes) {
    if (vus.has(mode.id)) defauts.push(`modes : « ${mode.id} » défini deux fois.`);
    vus.add(mode.id);
    const couverts = new Set(mode.phases.flatMap((phase) => phase.mois));
    const manquants = MOIS.filter((mois) => !couverts.has(mois));
    if (manquants.length > 0) {
      const lesMois = manquants.length === 1 ? 'le mois' : 'les mois';
      defauts.push(`modes : ${mode.id} laisse sans phase ${lesMois} ${manquants.join(', ')}.`);
    }
  }
  return defauts;
}

function anneeDuDebut({ id, debut }) {
  const annee = debut.slice(0, 4);
  return id.startsWith(`${annee}-`) ? [] : [`id : un élevage commence par l'année de son début, ${annee}-.`];
}

function modeDeLAnimal(fiche, { animaux }) {
  const animal = animaux.get(fiche.animal);
  if (fiche.mode === undefined || !animal) return [];
  if ((animal.modes ?? []).some((mode) => mode.id === fiche.mode)) return [];
  return [`mode : « ${fiche.mode} » n'est pas un mode de l'animal ${fiche.animal}.`];
}

function elevageParentDUneSouche({ origine, elevage_parent }) {
  if (origine === 'souche' && elevage_parent === undefined) {
    return ["elevage_parent : requis quand l'origine est souche."];
  }
  if (origine !== 'souche' && elevage_parent !== undefined) {
    return [`elevage_parent : réservé à une origine souche, pas ${origine}.`];
  }
  return [];
}

function finSelonStatut({ statut, fin }) {
  if (statut === 'en-cours' && fin) return ['fin : absente tant que le statut est en-cours.'];
  if (statut !== 'en-cours' && !fin) return [`fin : requise, datée, quand le statut est ${statut}.`];
  return [];
}

// En suivant les `derive_de`, on ne revient jamais à la recette de départ. Une
// boucle qui ne passe pas par elle se signale sur les recettes qui la forment.
function derivationSansBoucle(fiche, { recettes }) {
  const chaine = [fiche.id];
  for (let id = fiche.derive_de; id !== undefined; id = recettes.get(id)?.derive_de) {
    if (id === fiche.id) return [`derive_de : la chaîne ${[...chaine, id].join(' → ')} revient à la recette de départ.`];
    if (chaine.includes(id)) return [];
    chaine.push(id);
  }
  return [];
}

function ingredientsUniques({ ingredients }) {
  return enDouble(ingredients.map(({ ingredient }) => ingredient))
    .map((nom) => `ingredients : « ${nom} » écrit deux fois.`);
}

function phasesUniques({ phases }) {
  return enDouble(phases.map(({ id }) => id)).map((id) => `phases : « ${id} » écrite deux fois.`);
}

function enDouble(valeurs) {
  return [...new Set(valeurs.filter((valeur, i) => valeurs.indexOf(valeur) !== i))];
}

function plagesDeLaRecette({ phases }) {
  return phases.flatMap(({ id, duree_cible, temperature_c }) => [
    ...plageOrdonnee(id, 'duree_cible', duree_cible, enSecondes),
    ...plageOrdonnee(id, 'temperature_c', temperature_c),
  ]);
}

function temperaturesReleveesOrdonnees({ phases }) {
  return phases.flatMap(({ id, temperature_c }) => plageOrdonnee(id, 'temperature_c', temperature_c));
}

function plageOrdonnee(phase, champ, plage, mesure = (valeur) => valeur) {
  if (plage === undefined || mesure(plage.min) <= mesure(plage.max)) return [];
  return [`phases : ${phase}, ${champ} de ${plage.min} à ${plage.max}, le minimum dépasse le maximum.`];
}

// Une durée ISO 8601 ramenée en secondes, pour comparer les bornes d'une plage :
// un mois compte trente jours, une année trois cent soixante-cinq.
const JOUR = 86400;
const AVANT_T = { Y: 365 * JOUR, M: 30 * JOUR, W: 7 * JOUR, D: JOUR };
const APRES_T = { H: 3600, M: 60, S: 1 };

function enSecondes(duree) {
  const [jours, heures = ''] = duree.slice(1).split('T');
  const somme = (texte, unites) => [...texte.matchAll(/(\d+)([A-Z])/g)]
    .reduce((total, [, nombre, unite]) => total + Number(nombre) * unites[unite], 0);
  return somme(jours, AVANT_T) + somme(heures, APRES_T);
}

function dateDuDebut({ id, debut }) {
  const date = debut.slice(0, 10);
  return id.startsWith(`${date}-`) ? [] : [`id : une réalisation commence par la date de son début, ${date}-.`];
}

function finApresLeDebut({ debut, fin }) {
  return fin && precede(fin, debut) ? [`fin : ${fin} précède le début, ${debut}.`] : [];
}

function phasesDatees({ phases }) {
  return phases
    .filter(({ debut, fin }) => fin && precede(fin, debut))
    .map(({ id, debut, fin }) => `phases : ${id} finit le ${fin}, avant son début, ${debut}.`);
}

// Une date sans heure vaut pour toute la journée : face à une date avec heure,
// seuls les jours se comparent.
function precede(a, b) {
  const longueur = Math.min(a.length, b.length);
  return a.slice(0, longueur) < b.slice(0, longueur);
}

function versionDeLaRecette(fiche, { recettes }) {
  const recette = recettes.get(fiche.recette);
  if (!recette || fiche.recette_version <= recette.version) return [];
  return [`recette_version : ${fiche.recette_version} dépasse la version de la recette ${fiche.recette}, ${recette.version}.`];
}

function uneSeuleProvenance({ ingredients }) {
  return ingredients
    .filter(({ produit, culture }) => produit !== undefined && culture !== undefined)
    .map(({ ingredient }) => `ingredients : « ${ingredient} » porte à la fois un produit et une culture ; une seule provenance.`);
}

function ingredientsDeLaRecette(fiche, { recettes }) {
  const recette = recettes.get(fiche.recette);
  if (!recette) return [];
  const prevus = new Set(recette.ingredients.map(({ ingredient }) => ingredient));
  return fiche.ingredients
    .filter(({ ingredient, ajoute }) => !ajoute && !prevus.has(ingredient))
    .map(({ ingredient }) => `ingredients : « ${ingredient} » absent de la recette ${fiche.recette} ; ajoute: true s'il a été ajouté.`);
}

function phasesDeLaRecette(fiche, { recettes }) {
  const recette = recettes.get(fiche.recette);
  if (!recette) return [];
  const prevues = new Set(recette.phases.map(({ id }) => id));
  return fiche.phases
    .filter(({ id, ajoutee }) => !ajoutee && !prevues.has(id))
    .map(({ id }) => `phases : « ${id} » absente de la recette ${fiche.recette} ; ajoutee: true si elle a été ajoutée.`);
}

function participantsUniques({ avis = [] }) {
  return enDouble(avis.map(({ participant }) => participant))
    .map((participant) => `avis : « ${participant} » donne deux avis dans la même séance.`);
}
