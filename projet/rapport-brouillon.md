# Rapport — Brouillon

## Table des matières

## Structure

## Répartition des tâches
Les tâches ont été réparties selon les centres d’intérêts, les compétences et les disponibilités.

### Organisation
La supervision du projet a été confiée à Lorelei. Elle dispose d’années d’expérience dans l’associatif et l’évènementiel, et est actuellement cheffe de projet de Donut Jam Studio, studio de jeu vidéo indépendant.
Ayant pu prouver ses compétences en programmation dans le cadre d’autres cours d’ISH, elle a décidé de profiter du projet pour renforcer ses compétences de gestion.

### Développement
Matthias et Colin se sont portés volontaires pour le développement du logiciel. Les deux disposent de compétences préalables en JavaScript, et étaient intéressés par le challenge posé par le développement d’une application avec Electron.

---

## Organisation

### Cadre

### Planification

### Répartition des tâches

### Suivi


### Relations client
Colin était motivé à prendre contact avec le client. Lorelei l’a rejoint lors des séances pour le soutenir et garantir une continuité dans la vision du client.

---

## Relations

### Compte rendu des entretiens avec le client

Colin a pris contact avec le client par email et convenu d’une première séance de discussion afin de lui proposer le projet.

#### Première séance: Lundi 10 mars 2025
Participent: Colin Luginbühl, Client, Lorelei Chevroulet.

Présentation du pitch au client par Colin:

- Le logiciel permettrait de travailler sur des LVDELH en visualisant leurs réseaux plutôt que de remplir un tableau, la pratique actuelle.
- Avantages marqués pour la compréhension du LVDELH pendant sa numérisation, pas besoin d’attendre un export et éventuelle mise en forme: *what you see is what you get*.

Lorelei structure les discussion qui suivent. Le client pose les questions et remarques suivantes:

- *Le projet vaut-il la peine d'y investir du temps?*
  Oui! Il est obligatoire d'effectuer un projet de développement logiciel, et le fait de faire un logiciel utilitaire pour un autre cours fait sens à nos yeux. 

- *Est-ce qu'on pourrait trouver une manière de noter les **biomes** dans un LVDELH? C'est une faiblesse de l'encodage actuel.*
  Très bon axe de développement, vu que la technologie qu'on aimerait utiliser permet de répondre à ce besoin.

- *Est-ce qu'on pourrait utiliser cet affichage en réseau pour suivre des **itinéraires**?*
  Absolument, c'est une piste intéressante de développement. 

- *Le réseau permet également de se poser des questions sur les flux narratifs.*

  C'est un avantage de la visualisation des données encodées en réseau.

- *Trouvera-t-on du plaisir à développer ce logiciel?*
  Oui!

- *Supervision par le client*.
  Ça fait sens vu la situation: Le client est le client, et le responsable du cours l’équivalent d'une autorité tierce imposant des standards et pratiques spécifiques.

- *Est-ce qu'on aimerait pouvoir faire du multilingual?*
  A priori, non.

Coordination du RDV suivant.


#### Deuxième séance: Lundi 17 mars 2025
Participent: Colin Luginbühl, Client, Lorelei Chevroulet.

Lorelei clarifie les enjeux, et résume les trois axes de fonctionnalité du logiciel.

1. Fonction de découpage automatique du PDF d'un LVDELH pour en sortir la structure.
2. Chargement du CSV d'un LDVELH et affichage de ces informations sous forme de graphe.
3. Outils dans l'interface pour visualiser ces données et le cas échéant, les modifier et en rajouter.

L'audience est interne à l’institution du client, et le logiciel sera une interface simple pour en faciliter l'accès et la portabilité. Le logiciel ressort un fichier CSV de même format que celui pris en entrée.

Colin et Lorelei demandent un fichier CSV exemple pour faciliter le développement.

### Discussions avec l'autorité compétente

L’autorité compétente demande l’inclusion d’un *backend* et d’une base de données avec schéma entité-relations correspondants. C’est faisable. Après négociations, nous trouvons un accord sur un système basé sur le format JSON.

L’autorité compétente demande l’inclusion d’un système de comptes utilisateurs. C’est hors-cadre pour ce projet, qui relève davantage de l’application que de la page web: l’application tourne sur un système d’exploitation, et c’est celui-ci qui gère les utilisateurs. Refus d’entrée en matière, acceptation par l’autorité compétente après négociations. 

### Challenges

Le client est roi, mais le roi a besoin de sa cour: il est impossible de prendre comme décision finale toute suggestion venant du client. Plutôt, notre responsabilité est de le comprendre, de le guider et, s’il se fourvoie, le conseiller pour arriver à une compréhension commune des enjeux et objectifs. 

En l’espèce, nous avons dû plusieurs fois clarifier les objectifs tant avec le client qu’avec l’autorité compétente. Il est donc fondamental d’avoir des notes claires sur les discussions afin de pouvoir y retourner, et surtout, d’éviter de revenir sur des choses déjà établies.

Chaque doute doit être clarifié. Chaque désaccord doit être clairement exprimé en tant que tel: si c’est non, savoir dire non au client. 


---

## Développement
#TODO: reformuler
- JS dur au début vs python
- web donc multithreading par défaut, pratique mais aussi challenge
- traitement des données plus galère que sur python
- découvertes sur les fonctions avancées de JS
- faire du backend en JS? 
- OOP -> ok! fonctions marchaient avant et donc c’était assez facile
- limitations de la librairie cytoscape: une seule classe
- UI: challenges visuels, CSS
- accumulation de fonctions, etc.
- dev collaboratif: c’est bien allé
- jongler avec les codes générés par d’autres (chatGPT, collègues, etc.)
- galères habituelles
- objectifs clairs
- répartition du travail
- diagrammes utiles
- protection contre les remous externes
- 


---

## Lessons
- js
    - async, promesses
    - dev
    - css
    - process data
    - interactivité
    - ->
- collaboration
- management
    - gantt
    - whatevs
    - travail équipe
- github
    - ci/cd
    - branches
- contact client

Try not to fail; if you do, then move on. 





