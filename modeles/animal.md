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
  - { soin: controle, frequence: hebdomadaire }
  - { soin: renouvellement-substrat, frequence: bimestrielle }
procedures: [preparation-substrat-terre]
photos: []
---

Ce que l'espèce demande, et ce que j'en ai appris : réglementation du ramassage, alimentation (régime, aliments, quantité et rythme des repas), abris, erreurs à ne pas refaire.
