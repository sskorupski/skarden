---
id: petit-gris
nom: Petit-gris
nom_latin: Helix aspersa aspersa
famille: helicides
milieu: terrestre
protection: encadree
plages:
  - { parametre: temperature-c, max: 0, etat: mortel }
  - { parametre: temperature-c, min: 5, max: 8, etat: dormance }
  - { parametre: temperature-c, min: 10, max: 12, etat: a-eviter }
  - { parametre: temperature-c, min: 18, max: 22, etat: actif }
  - { parametre: humidite-pct, min: 75, max: 90, etat: actif }
modes:
  - id: hibernation
    phases:
      - { phase: dormance, mois: [11, 12, 1, 2] }
      - { phase: reveil, mois: [3, 4] }
      - { phase: activite, mois: [4, 5, 6, 7, 8, 9] }
      - { phase: reproduction, mois: [4, 5, 6, 7, 8, 9] }
      - { phase: preparation, mois: [10] }
  - id: activite-continue
    phases:
      - { phase: activite, mois: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }
densite: { min: 100, max: 150, unite: par-m2-sol }
complements: [calcium, farine-d-elevage]
reproduction:
  mode: oeufs
  fecondite: { min: 80, max: 100 }
stades: [oeuf, juvenile, adulte]
routine:
  - { soin: brumisation, frequence: quotidienne, phases: [activite, reproduction] }
  - { soin: nourrissage, frequence: quotidienne, phases: [activite, reproduction] }
  - { soin: nettoyage, frequence: quotidienne, phases: [activite, reproduction] }
  - { soin: controle, frequence: hebdomadaire }
  - { soin: renouvellement-substrat, frequence: bimestrielle }
procedures: [preparation-substrat-terre]
photos: []
---

## Réglementation

Le ramassage du petit-gris est encadré par arrêté préfectoral dans beaucoup de départements : vérifier auprès de la préfecture avant toute cueillette. Le plus sûr est d'acheter des reproducteurs chez un héliciculteur.

## Températures

Entre 10 et 12 °C, les escargots se réveillent et se rendorment sans cesse : ils épuisent leurs réserves sans vraiment se nourrir. Il faut choisir entre l'hibernation (5 à 8 °C, jamais de gel) et l'activité toute l'année (18 à 20 °C, éclairage de 12 à 14 h par jour).

- **Hibernation** : substrat juste frais, plus de brumisation, plus de nourriture une fois les escargots fermés par leur épiphragme. Au réveil, en mars-avril, remonter progressivement la température et l'humidité, puis reprendre l'alimentation. En octobre, réduire la nourriture et l'humidité, et renouveler le substrat.
- **Activité continue** : chauffer et éclairer l'installation (voir sa fiche).

## Routine

- Le soir : brumiser sans laisser d'eau stagnante, et donner des végétaux frais. Au chaud, la terre sèche plus vite : brumiser plus souvent.
- Le matin : retirer les restes de la veille, pour éviter les moisissures.
- Chaque semaine : vérifier la température, l'humidité et les pontes.
- Tous les 1 à 2 mois : renouveler le substrat, ou plus tôt en cas de mauvaise odeur ou de moisissure. Humidité juste : une poignée serrée tient sans goutter.

## Régime et rations

**Régime : herbivore.**

- **Aliments** : des végétaux frais et non traités (salade, chou, carotte, courgette, orties). Une farine spéciale héliciculture peut compléter.
- **Calcium** : de l'os de seiche ou des coquilles d'œufs broyées, **à disposition en permanence**. Il est indispensable à la coquille et à la ponte.
- **Rythme** : un repas chaque soir en période active. Les escargots mangent la nuit.
- **Quantité** : le guide ne la chiffre pas. On donne de la nourriture fraîche chaque soir, et l'on retire le lendemain matin ce qui reste, pour éviter les moisissures. Des restes chaque matin disent qu'il faut donner moins.
- **Selon la phase** :
  - en octobre, en préparation, réduire la nourriture ;
  - en dormance, ne plus rien donner une fois les escargots fermés par leur épiphragme ;
  - au réveil, en mars-avril, reprendre l'alimentation après avoir remonté la température et l'humidité.

## Abris

Planches, tuiles ou feuilles de chou, pour se cacher le jour.

## Reproduction

La ponte demande 18 à 22 °C, 12 à 14 h de lumière par jour et un substrat meuble de 8 à 10 cm. Chaque adulte peut pondre 80 à 100 œufs : sans gestion, 100 escargots deviennent plusieurs milliers de jeunes en une saison. Pour rester à une centaine, agrandir (un parc d'engraissement séparé de quelques m² pour les jeunes) ou stabiliser (retirer les pontes au fur et à mesure).

## Substrat

Terre du jardin sur 8 à 10 cm, préparée selon la procédure. Jamais de terre ayant reçu des anti-limaces : le métaldéhyde est mortel pour eux.
