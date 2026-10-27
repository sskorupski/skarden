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
  - { soin: nettoyage, frequence: hebdomadaire }
procedures: [mise-en-place-aquarium-escargots, preparation-substrat-terre]
photos: []
---

## Réglementation

Le ramassage du petit-gris est encadré par arrêté préfectoral dans beaucoup de départements : vérifier auprès de la préfecture avant toute cueillette. Le plus sûr est d'acheter des reproducteurs chez un héliciculteur.

## Températures

Entre 10 et 12 °C, les escargots se réveillent et se rendorment sans cesse : ils épuisent leurs réserves sans vraiment se nourrir. Il faut choisir entre l'hibernation (5 à 8 °C, jamais de gel) et l'activité toute l'année (18 à 20 °C, éclairage de 12 à 14 h par jour).

- **Hibernation** : substrat juste frais, plus de brumisation, plus de nourriture une fois les escargots fermés par leur épiphragme. Au réveil, en mars-avril, remonter progressivement la température et l'humidité, puis reprendre l'alimentation. En octobre, réduire la nourriture et l'humidité, et renouveler le substrat.
- **Activité continue** : chauffer et éclairer l'installation (voir sa fiche).

## Éclairage

Ce qui compte est la durée du jour, pas l'intensité. Les escargots sont surtout actifs la nuit et n'ont pas besoin d'UV : la lumière leur sert de repère saisonnier, pour rester actifs et se reproduire.

- **Activité normale** : 12 à 14 h de lumière, par exemple de 8 h à 21 h.
- **Pour stimuler la ponte** : jusqu'à 16 h. Les jours longs déclenchent la reproduction : on peut allonger progressivement au printemps.
- **La nuit** : vraiment noire, car c'est là qu'ils mangent et se déplacent.
- **Les abris** : toujours en place, pour qu'ils puissent se mettre à l'ombre en journée.
- **En hibernation** : pas d'éclairage. La pénombre du garage suffit, et la lumière risquerait de les réveiller.

Le matériel et sa pose sont décrits dans la fiche de l'aquarium du garage.

## Routine

- **Le soir** : brumiser sans laisser d'eau stagnante, et poser des végétaux frais sur une coupelle, jamais à même le substrat. Au chaud, la terre sèche plus vite : brumiser plus souvent.
- **Tous les jours ou tous les deux jours** : retirer les restes, pour éviter les moisissures.
- **En permanence** : un substrat humide mais jamais détrempé. Une poignée pressée ne doit pas goutter.
- **Chaque semaine** :
  - vérifier la température, l'humidité et les pontes ;
  - nettoyer les parois et retirer les déjections visibles.
- **Au besoin** : remplacer environ un tiers du substrat, en surface. L'ancien sert d'amendement pour les plantes.

## Régime et rations

**Régime : herbivore.**

- **Aliments** : des végétaux frais et non traités (salade, chou, carotte, courgette, orties). Une farine spéciale héliciculture peut compléter.
- **Calcium** : de l'os de seiche ou des coquilles d'œufs broyées, **à disposition en permanence**. Il est indispensable à la coquille et à la ponte.
  - Autre source possible : de la poudre de coquille d'huître. [Une étude sur l'escargot géant d'Afrique](https://revues.cirad.fr/index.php/cahiers-agricultures/article/view/29920) l'a éprouvée : son calcium est digéré à 84 %, et elle recommande d'en mettre 15 % dans l'alimentation des jeunes. Cette étude porte sur une autre espèce que le petit-gris.
- **Rythme** : un repas chaque soir en période active. Les escargots mangent la nuit.
- **Quantité** : le guide ne la chiffre pas. On donne de la nourriture fraîche chaque soir, **toujours sur une coupelle, jamais à même le substrat**, et l'on retire les restes tous les jours ou tous les deux jours, pour éviter les moisissures. Des restes chaque matin disent qu'il faut donner moins.
- **Selon la phase** :
  - en octobre, en préparation, réduire la nourriture ;
  - en dormance, ne plus rien donner une fois les escargots fermés par leur épiphragme ;
  - au réveil, en mars-avril, reprendre l'alimentation après avoir remonté la température et l'humidité.

## Abris

Planches, tuiles ou feuilles de chou, pour se cacher le jour.

## Reproduction

La ponte demande 18 à 22 °C, 12 à 14 h de lumière par jour, et jusqu'à 16 h pour la stimuler (voir Éclairage), ainsi qu'un substrat meuble de 8 à 10 cm. Chaque adulte peut pondre 80 à 100 œufs : sans gestion, 100 escargots deviennent plusieurs milliers de jeunes en une saison. Pour rester à une centaine, agrandir (un parc d'engraissement séparé de quelques m² pour les jeunes) ou stabiliser (retirer les pontes au fur et à mesure).

## Substrat

La structure du bac (drainage, séparation, substrat, litière) et le mélange du substrat sont décrits dans la procédure de mise en place d'un aquarium à escargots. La terre du jardin en est une alternative, préparée selon sa propre procédure. Jamais de terre ayant reçu des anti-limaces : le métaldéhyde est mortel pour eux.
