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
