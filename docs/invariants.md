# Invariants

Les contraintes que le référentiel ne transgresse pas. Les citer par leur numéro, en revue, en message de commit, en commentaire.

**En changer** se fait par une décision explicite : un cadrage dans [ssk-it/skarden-cadrage](https://github.com/ssk-it/skarden-cadrage), puis une demande de fusion qui modifie ce fichier. Jamais par contournement. Un invariant levé garde son numéro, marqué comme levé, avec la date et la raison.

## INV-1 — Ce dépôt est la seule source

Les fiches et les photos de Skarden vivent ici, et nulle part ailleurs. L'interface [skarden-web](https://github.com/ssk-it/skarden-web) les lit ; si elle écrit un jour, elle n'écrit que dans ce dépôt, par des commits. Ce que la règle protège : une seule vérité, dont Git garde l'histoire. Sans elle, une copie dans une base ou un cache de l'interface finit par diverger, et l'on ne sait plus laquelle croire.

## INV-2 — Une fiche reste lisible en Markdown brut

Une fiche se lit et s'écrit dans un simple éditeur, ou sur GitHub, sans l'interface : un frontmatter YAML aux noms de champs parlants, des valeurs lisibles (`plein-soleil`, pas un code), un corps en Markdown ordinaire. Ce que la règle protège : le référentiel survit à son interface. Sans elle, un champ encodé pour la commodité d'un écran rend les fiches illisibles le jour où l'écran disparaît.

## INV-3 — Les photos passent par Git LFS, jamais dans l'historique Git

Tout fichier de `medias/` entre dans l'historique comme un pointeur LFS. Ce que la règle protège : un clone qui reste léger et rapide. Sans elle, une photo commitée telle quelle alourdit chaque clone pour toujours, et ne se retire qu'en réécrivant l'historique. Vérifié par `pnpm verifier:lfs`, dans les contrôles de chaque demande de fusion.
