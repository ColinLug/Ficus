# Rapport — Ficus

## À Propos — Ficus

Ficus est un logiciel assistant à la numérisation de *Livres dont vous êtes le héros*, ci-après LDVELH. Ces livres sont l’objet de recherches de notre client en section d’ISH à l’Université de Lausanne.
La méthode en vigueur jusqu’alors était la saisie manuelle de liens passage-sortie et variables associées dans un tableau CSV. La visualisation du LDVELH n’est possible qu’une fois le tableau complet et importé dans un logiciel tiers, qui ne propose pas de corriger les données importées.

Ainsi, Ficus offre une interface permettant non seulement l’import de fichiers CSV pour numériser les LVDELH, mais également de visualiser en temps réel le système de noeuds lié à l’intrigue du livre et de le modifier. Il est non seulement possible d’effacer et rajouter des nœuds, des variables, des liens, mais en plus d’importer le fichier PDF du livre pour bénéficier d’un aperçu des passages correspondant à chaque nœud.

Ce rapport se concentre sur la création du logiciel.

---

## Répartition des tâches

Les tâches ont été réparties selon les centres d’intérêts, les compétences et les disponibilités.

### Organisation

La supervision du projet a été confiée à Lorelei. Elle dispose d’années d’expérience dans l’associatif et l’évènementiel, et est actuellement cheffe de projet de Donut Jam Studio, studio de jeu vidéo indépendant.
Ayant pu prouver ses compétences en programmation dans le cadre d’autres cours d’ISH, elle a décidé de profiter du projet pour renforcer ses compétences de gestion.

### Développement

Matthias et Colin se sont portés volontaires pour le développement du logiciel. Les deux disposent de compétences préalables en JavaScript, et étaient intéressés par le challenge posé par le développement d’une application avec Electron.

### Relations client

Colin était motivé à prendre contact avec le client. Lorelei l’a rejoint lors des séances pour le soutenir et garantir une continuité dans la vision du client.

---

## Organisation

### Cadre

Le cadre est posé en prenant compte d’un côté des besoins et espoirs du client, et de l’autre des possibilités techniques avec les moyens à disposition.
Ainsi, une liste de spécifications est créée, avec des spécifications bonus en cas d’avance sur la planification.

Les standards en matière de language sont posés par l’autorité compétente. 

Plusieurs discussions techniques permettent de créer un schéma tant pour les données en question (schéma entité-relations) que pour la structure du code (schéma UML). Les discussions avec le client permettent de valider des pré-rendus d’interface pour le logiciel. 

### Planification

Une fois les spécifications posées, un schéma de Gantt est créé pour structurer le développement dans le temps. Celui-ci a été fait en prévision de la charge de travail plus élevée en fin de semestre: cette décision se montrera judicieuse. 

### Suivi

Au cours du semestre, Lorelei s’assure de maintenir le suivi du planning et des spécifications. Elle fait le contact avec l’autorité compétente et le client lors des réunions, et garantit la stabilité du projet tant face au demandes qu’aux imprévus. 

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

### Complications

Le client est roi, mais le roi a besoin de sa cour: il est impossible de prendre comme décision finale toute suggestion venant du client. Plutôt, notre responsabilité est de le comprendre, de le guider et, s’il se fourvoie, le conseiller pour arriver à une compréhension commune des enjeux et objectifs. 

En l’espèce, nous avons dû plusieurs fois clarifier les objectifs tant avec le client qu’avec l’autorité compétente. Il est donc fondamental d’avoir des notes claires sur les discussions afin de pouvoir y retourner, et surtout, d’éviter de revenir sur des choses déjà établies.

Chaque doute doit être clarifié. Chaque désaccord doit être clairement exprimé en tant que tel: si c’est non, savoir dire non au client. 

---

## Développement

### Déroulement

Les développeurs se basent sur le cadre posé tant par le client et l’autorité compétente que par celui fait lors des étapes d’organisation. Ils disposent donc d’une vision bornée par des objectifs clairs et soutenue par des contraintes de mise en pratique.

### Complications

Suivent les points d’intérêt ayant émergé au cours du développement.

#### Par rapport à JavaScript: 
1. Les développeurs ont dû se familiariser avec le language, mais ont été aidé par sa popularité sur le web et donc la documentation à disposition.
2. Comme le language fonctionne de manière asynchrone par défaut, les développeurs ont dû s’habituer au fonctionnement des promesses et attente de réponse du language. Ces fonctions permettent de bien meilleures performances à l’exécution de l’application.
3. Le traitement de données est plus compliqué que sur Python, mais l’expérience est enrichissante. 

#### Au-delà de JavaScript:
1. Travailler en équipe peut demander des efforts, mais reste positif.
2. La présence d’une gestionnaire de projet a permis de protéger les développeurs des allers et retours des attentes externes et ainsi permettre un développement stable.
3. Disposer d’objectifs et attentes claires améliore l’efficacité de développement. 
4. Avoir un système de déploiement automatisé via GitHub simplifie beaucoup le développement.

---

## Morale

*Try not to fail; if you do, move on.*





