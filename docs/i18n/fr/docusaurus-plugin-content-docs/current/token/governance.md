# Gouvernance

## Comment fonctionne la gouvernance Audius

La gouvernance est le processus par lequel les détenteurs de jetons AUDIO promulguent des changements à l'Audius par le biais de propositions sur la chaîne.

Il permet à la communauté de façonner directement les futures itérations de la plate-forme et constitue le principe fondamental qui motive l’infrastructure décentralisée d’Audius.


Dans ce poste, nous vous expliquerons comment fonctionne la gouvernance dans Audius et ce que vous pouvez faire en tant que détenteur d’AUDIO pour vous impliquer.


### **Portail de Gouvernance**

La source unique de vérité pour la gouvernance d'Audius se trouve dans le tableau de bord du protocole sous l'onglet [Gouvernance](https://dashboard.audius.org/governance).


Vous y trouverez une liste de toutes les propositions actives et résolues, classées par ordre chronologique et indiquant si elles ont été acceptées ou rejetées.


Chaque proposition de gouvernance est accompagnée d'une répartition des paramètres suivants :


* _Proposer_ - L'adresse responsable de la soumission de la proposition
* _Description_ - Une synthèse rapide de ce que la proposition de gouvernance implique
* _Pour_ - Le nombre de votes en faveur de la proposition
* _Contre_ - Le nombre de votes contre la proposition

**Toutes les propositions sont soumises à 5% du quorum de $AUDIO et à une majorité de 50%.**


Cela signifie que pour qu'une proposition soit adoptée, au moins 5% de tous les $AUDIO misés doivent voter sur la proposition et plus de 50% des votes doivent être "Pour" la proposition.


Aujourd'hui, seuls ceux qui exécutent un nœud peuvent faire une proposition en chaîne. À l'avenir, l'ensemble des proposants autorisés pourrait être élargi de la manière dont la communauté le jugera bon.


### **Processus de gouvernance**

Une gouvernance efficace est bien plus que le vote de propositions sur la chaîne, et c'est quelque chose que nous voulons rendre encore plus accessible chez Audius.


Voici un aperçu de l'écosystème de gouvernance évolutif d'Audius, y compris les outils, les processus et la logistique qui sous-tendent le vote AUDIO.


_Commentaires sur Discord > Message sur le forum > Soumettre au portail de gouvernance > Vote en chaîne / On-chain > Exécuter_


Veuillez noter que certains utilisateurs peuvent être plus enclins que d'autres à faciliter la durée de ce processus, et nous recommandons à toute personne intéressée par l'évolution d'Audius de contribuer de toutes les manières possibles, même si cela signifie simplement entamer une conversation autour d'un sujet sur Discord !


#### **Gouvernance dans Discord**

Dans la [Discord AUDIOphile](https://discord.gg/ah5CcqW), tu remarqueras un canal appelé \#governance. C'est ici que les premières propositions et les premières idées peuvent être soumises aux commentaires de la communauté.


Il n'est pas nécessaire d'obtenir un retour sur une proposition dans Discord, mais c'est un excellent moyen de savoir si un sujet mérite ou non d'être approfondi avant de le soumettre sur le forum pour une discussion plus formelle.


Les sujets de gouvernance peuvent être considérés comme un moyen de signalisation, où les proposants reçoivent un feedback de très haut niveau de la part des autres membres de la communauté pour voir si leurs idées seront bien reçues en principe.


#### **Audius Forum**

Le forum Audius [gouvernance](https://gov.audius.org/) est l'endroit principal pour discuter des détails approfondis autour des propositions.


Il est recommandé que toutes les propositions couvrent les sujets suivants :


* _Titre_ - De quoi traite cette proposition ?
* _Résumé_ - Qu'est-ce qu'une brève explication / EIL5 de cette proposition ?
* _Résumé_ - Que se passera-t-il si cette proposition est mise en œuvre ? Quel contexte et quelles informations supplémentaires pouvez-vous offrir ?
* _Motivation_ - Quel est le raisonnement qui motive cette proposition et son intérêt pour Audius ?
* _Spécification_ - Que signifie voter pour ou contre cette proposition ?
* _Sondage_ - Voteriez-vous pour ou contre cette proposition ?

Bien qu'il n'en soit qu'à ses débuts, le forum de gouvernance d'Audius est le meilleur endroit pour concrétiser des idées avant de les soumettre à un vote sur la chaîne.

Les votes sur la chaîne nécessitent beaucoup de signaux et de coordination. Le forum de gouvernance offre donc un bon moyen de finaliser les détails les plus fins d'une proposition avant de la lancer sur la chaîne pour un vote de la communauté.


#### **Portail de Gouvernance**

Après avoir reçu des commentaires, les opérateurs de nœuds peuvent soumettre cette proposition sur la chaîne via le portail de gouvernance.

Veuillez noter que le pouvoir de proposition est corrélé à la quantité d'AUDIO misée ou déléguée pour la sécurité du réseau, ce qui signifie que les opérateurs de nœuds sont les principaux candidats pour les propositions sur la chaîne.

Une liste de toutes les propositions on-chain peut être trouvée [ici](https://dashboard.audius.org/#/governance).


Les détails de la proposition doivent correspondre aux spécifications décrites dans le message du forum, y compris les détails et la mise en œuvre de tout changement technique nécessaire à la mise en œuvre de la proposition.


#### **Vote sur la chaîne**

En prenant comme exemple la proposition de gouvernance la plus récente , vous pouvez constater que différents opérateurs de nœuds et délégués ont voté en faveur de l'extension de la durée du vote de 48 à 72 heures.


![](https://assets.website-files.com/6024b69839b1b7fd3787991c/607d16049feb3a126f852b57_H6OK09A-2szawbI66mlGi7489J5aj-x604boPIeDUs6zhfZB7Fs77rIsaskaMGslMNWdGrTfm2ZM_sLalkwBvLCn-I0aUm7g9aSIYr11qC0b2t5WHELcyUtSlK21OaD5UgB9mnRN.png)


Étant donné que le nombre total de votes \(1 AUDIO, 1 vote\) était supérieur au quorum requis de ~11M $AUDIO et la majorité de 50% \(100% ont voté en faveur\) la proposition a été adoptée !


Ce faisant, les modifications de cette proposition ont été exécutées par le biais du contrat de gouvernance, faisant passer la fenêtre de vote de 48 heures à 72 heures !


#### **Multisig communautaire**

Une fois le vote passé, le contrat de gouvernance exécute la proposition.


Cependant, Audius présente également un multisig communautaire comme veto de dernier recours, mentionné dans le livre blanc de la section « court-circuitant » de la gouvernance.


Cela signifie qu'un ensemble de 9 membres de la communauté Audius ont la possibilité d'empêcher une proposition malveillante de passer. Dans le cas où le multisig est utilisé, 6 des 9 signataires doivent signer une transaction pour annuler la proposition.


Comme Audius continue de mûrir, la communauté peut à tout moment voter pour supprimer ce droit de veto du système également.


Plus de détails sur les signataires de ce multisig ainsi que sur l'intention de son utilisation seront partagés dans un prochain billet de blog.


### **Gouvernance évolutive**

La gouvernance Audius est un processus évolutif visant à donner à tous les détenteurs de $AUDIO une voix sur les futures itérations de la plateforme.


Le processus décrit ci-dessus est susceptible d'évoluer en fonction des nouveaux outils, des mises à niveau de produits et des mises en service, afin de permettre à tous les utilisateurs de jetons d'examiner et de participer facilement aux décisions de gouvernance, quelles que soient leurs connaissances techniques.


Nous sommes impatients de partager plus de détails sur la gouvernance dans un avenir proche et de développer le protocole de streaming communautaire qu'est Audius !
