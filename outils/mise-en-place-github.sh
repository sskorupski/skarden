#!/usr/bin/env bash
# Crée le dépôt public sskorupski/skarden sur GitHub, y pousse main, et pose ses réglages.
#
# Relançable : un dépôt déjà créé n'est pas recréé, un réglage déjà posé est
# reposé à l'identique. S'appuie sur la session `gh` déjà ouverte ; aucun
# secret n'est demandé ni affiché.
set -euo pipefail

DEPOT="sskorupski/skarden"
RACINE="$(cd "$(dirname "$0")/.." && pwd)"

confirmer() {
  read -r -p "$1 [o/N] " reponse
  [[ "$reponse" == "o" || "$reponse" == "O" ]]
}

if gh repo view "$DEPOT" >/dev/null 2>&1; then
  echo "Le dépôt $DEPOT existe déjà."
else
  confirmer "Créer le dépôt PUBLIC $DEPOT et y pousser main ?" || exit 1
  gh repo create "$DEPOT" --public \
    --description "Skarden — que faut-il à chacune de mes plantes, et qu'ai-je appris en les cultivant ? Une fiche Markdown par plante et par culture." \
    --source "$RACINE" --remote origin --push
fi

# Les branches fusionnées disparaissent d'elles-mêmes.
gh repo edit "$DEPOT" --delete-branch-on-merge
echo "delete_branch_on_merge : $(gh api "repos/$DEPOT" -q .delete_branch_on_merge)"
echo "Réglages posés sur $DEPOT."
