# Specifications: Ficus

Ficus est un logiciel d'aide à la numérisation de LDVELH (livre dont vous êtes le héros).

## Version minimale
1. Ficus prend en entrée un fichier CSV contenant un LVDELH numérisé.
2. Sur la base de ce CSV, il affiche un graphe en réseau représentant les liens entre les passages.
3. Cliquer sur un passage permet de visualiser les informations liées à ce passage dans le CSV.
4. Ces informations peuvent être modifiées par l'user.
5. L'user peut ajouter ou retirer des colonnes.
6. L'interface propose un outil de balisage qui applique une valeur à une variable définie sur tous les passages entre un passage A et B.
7. Les données sont sauvegardées dans le stockage du navigateur pendant le travail.
8. Les données peuvent être exportées en CSV à tout moment. Ce CSV est de même format que le CSV accepté en entrée.
9. Ficus est disponible en tant qu'application type Electron.

## Version idéale
1. Simple database pour sauvegarder en local les données.

## Bonus
1. Version server-side.
2. Avec docker-compose.
3. Et træfik pour gérer une authentification via liens uniques.
