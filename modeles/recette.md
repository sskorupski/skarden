---
id: liqueur-hibiscus
nom: Liqueur d'hibiscus
categorie: liqueur
version: 1
rendement: { quantite: 1, unite: l }
ingredients:
  - { ingredient: hibiscus, quantite: 40, unite: g, conservation: seche }
  - { ingredient: alcool-neutre, quantite: 700, unite: ml, note: à 40 % vol }
  - { ingredient: sucre, quantite: 200, unite: g }
  - { ingredient: eau, quantite: 300, unite: ml }
phases:
  - id: maceration
    libelle: Macération des fleurs dans l'alcool
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
sources: []
photos: []
---

Le principe, les conseils et les pièges à éviter : ce qui se goûte à la filtration, ce qu'une macération trop longue donne.
