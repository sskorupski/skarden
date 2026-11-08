---
id: liqueur-hibiscus-gingembre
nom: Liqueur d'hibiscus au gingembre
categorie: liqueur
version: 1
derive_de: liqueur-hibiscus
rendement: { quantite: 1, unite: l }
ingredients:
  - { ingredient: hibiscus, quantite: 40, unite: g, conservation: seche }
  - { ingredient: alcool-neutre, quantite: 700, unite: ml, note: à 40 % vol }
  - { ingredient: sucre, quantite: 200, unite: g }
  - { ingredient: eau, quantite: 300, unite: ml }
  - { ingredient: gingembre, quantite: 20, unite: g, conservation: frais, note: en fines lamelles }
  - { ingredient: cannelle, quantite: 1, unite: piece, conservation: seche, note: un bâton }
  - { ingredient: zeste-orange, quantite: 1, unite: piece, conservation: frais, optionnel: true }
phases:
  - id: maceration
    libelle: Macération des fleurs et des épices dans l'alcool
    duree_cible: { min: P3D, max: P5D }
    temperature_c: { min: 18, max: 22 }
    contenant_categorie: bocal
    conditions: à l'abri de la lumière
  - id: filtration
    libelle: Filtration
  - id: assemblage
    libelle: Assemblage avec le sirop de sucre et d'eau, refroidi
  - id: repos
    libelle: Repos avant de servir
    duree_cible: { min: P2W, max: P4W }
    contenant_categorie: bouteille
    conditions: à l'abri de la lumière
---

La liqueur d'hibiscus, avec du gingembre frais, de la cannelle et un zeste d'orange.
