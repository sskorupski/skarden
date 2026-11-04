#!/usr/bin/env bash
# Crée le dépôt public sskorupski/skarden sur GitHub, y pousse main, et pose ses
# réglages : suppression des branches fusionnées, règle de main, et ce dont
# dépend une photo postée depuis le site — Git LFS actif, fusion automatique
# permise (cadrage 2026-006 de ssk-it/skarden-cadrage).
#
# Relançable : un dépôt déjà créé n'est pas recréé, un réglage déjà posé est
# reposé à l'identique. S'appuie sur la session `gh` déjà ouverte ; aucun
# secret n'est demandé ni affiché. Le jeton de cette session ne sert qu'à la
# sonde LFS, passé à curl par un descripteur, jamais en argument.
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

# main n'accepte que ce que les contrôles ont validé : un ensemble de règles
# (ruleset) exige leur succès, et refuse la suppression et la poussée forcée.
# Personne n'en est dispensé, administrateurs compris.
command -v jq >/dev/null || { echo "jq introuvable." >&2; exit 1; }
REGLES_NOM="Contrôles requis sur main"
CONTROLE="Référentiel (tests, fiches, photos en LFS)"
# Branche à jour exigée : des contrôles verts sur une base que main a dépassée
# ne disent rien de ce que donnera la fusion.
A_JOUR=true
# 15368 : l'application GitHub Actions, seule à pouvoir rendre ce contrôle.
REGLES="$(jq -n --arg nom "$REGLES_NOM" --arg controle "$CONTROLE" --argjson a_jour "$A_JOUR" '{
  name: $nom, target: "branch", enforcement: "active", bypass_actors: [],
  conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
  rules: [
    { type: "deletion" },
    { type: "non_fast_forward" },
    { type: "required_status_checks", parameters: {
        do_not_enforce_on_create: false,
        strict_required_status_checks_policy: $a_jour,
        required_status_checks: [ { context: $controle, integration_id: 15368 } ] } }
  ] }')"
normaliser() { jq -S '{name, target, enforcement, bypass_actors, conditions, rules: (.rules | sort_by(.type))}'; }

ID="$(gh api "repos/$DEPOT/rulesets" --jq ".[] | select(.name == \"$REGLES_NOM\") | .id")"
if [[ -z "$ID" ]]; then
  if confirmer "Exiger « $CONTROLE » sur main de $DEPOT (branche à jour : $A_JOUR) ?"; then
    gh api -X POST "repos/$DEPOT/rulesets" --input - <<< "$REGLES" >/dev/null
  fi
elif [[ "$(gh api "repos/$DEPOT/rulesets/$ID" | normaliser)" == "$(normaliser <<< "$REGLES")" ]]; then
  echo "Règles « $REGLES_NOM » déjà en place."
elif confirmer "Les règles « $REGLES_NOM » de $DEPOT diffèrent : les remettre à l'identique ?"; then
  gh api -X PUT "repos/$DEPOT/rulesets/$ID" --input - <<< "$REGLES" >/dev/null
fi
echo "Contrôles requis sur main : $(gh api "repos/$DEPOT/rules/branches/main" \
  --jq '[.[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | join(", ")')"

# Une photo postée depuis le site passe par LFS, et sa demande de fusion se
# fusionne seule une fois les contrôles verts.
# GitHub active LFS d'office, et aucune route ne lit son état : le reposer est
# sans effet s'il est déjà actif. La sonde plus bas dit ce qu'il en est.
if confirmer "Activer Git LFS sur $DEPOT (PUT repos/$DEPOT/lfs) ?"; then
  gh api -X PUT "repos/$DEPOT/lfs" >/dev/null
fi
if [[ "$(gh api "repos/$DEPOT" -q .allow_auto_merge)" == "true" ]]; then
  echo "Fusion automatique déjà permise."
elif confirmer "Permettre la fusion automatique des demandes de fusion de $DEPOT ?"; then
  gh repo edit "$DEPOT" --enable-auto-merge
fi

# Vérifié de l'extérieur. La fusion automatique, relue par l'API.
echo "allow_auto_merge : $(gh api "repos/$DEPOT" -q .allow_auto_merge)"
# LFS, par une requête batch « upload » pour un objet fictif, jamais envoyé : un
# dépôt où LFS reçoit rend une action « upload ». Sa réponse porte un en-tête
# signé : seul jq la lit, et n'en rend que la présence de l'action.
OID="$(printf 'skarden : sonde LFS %s' "$(date +%s)" | shasum -a 256 | cut -d' ' -f1)"
JETON="$(gh auth token)"
LFS_RECOIT="$(curl -sSf -K <(printf 'user = "x-access-token:%s"\n' "$JETON") \
  -H 'Accept: application/vnd.git-lfs+json' -H 'Content-Type: application/vnd.git-lfs+json' \
  --data "{\"operation\":\"upload\",\"transfers\":[\"basic\"],\"objects\":[{\"oid\":\"$OID\",\"size\":1}]}" \
  "https://github.com/$DEPOT.git/info/lfs/objects/batch" \
  | jq '.objects[0].actions.upload != null')" || LFS_RECOIT="injoignable"
unset JETON
echo "Git LFS reçoit un envoi : $LFS_RECOIT"
echo "Réglages posés sur $DEPOT."
[[ "$LFS_RECOIT" == "true" ]] || { echo "Git LFS ne reçoit pas d'envoi sur $DEPOT : une photo postée depuis le site ne pourrait pas être convertie." >&2; exit 1; }
