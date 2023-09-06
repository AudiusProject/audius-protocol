---
sidebar_label: Staking
sidebar_position: 2
---

# Staking

### Qu'est-ce que le Stacking?

Construit comme un protocole décentralisé sur Ethereum, tout le contenu, les informations et les données sur Audius sont stockés et indexés par un réseau croissant d'opérateurs de nœuds tiers, plutôt que par l'équipe Audius.

Pour garantir la fiabilité et la maintenance de ce contenu, les opérateurs de nœuds sont tenus de fournir une garantie ou une " sake " comme caution pour le service du protocole. Cette mise, exprimée en $AUDIO, garantit que les opérateurs de nœuds disposent de jetons à risque qui peuvent être supprimés, ou pris, en cas de comportement malveillant ou médiocre.

En utilisant des jetons $AUDIO comme collatéral, toute personne disposant du matériel adéquat peut devenir opérateur de nœud sans aucune autorisation. Plus le nombre de $AUDIO mis en jeu dans le protocole est élevé, plus le réseau est sécurisé et moins il est vulnérable aux attaques extérieures.

En récompense des services rendus au réseau, les opérateurs de nœuds peuvent gagner des $AUDIO grâce à l'émission automatique sur la chaîne, ou à la création continue de nouveaux jetons distribués aux acteurs à valeur ajoutée.

Ceux qui misent plus d' $AUDIO ont la possibilité de gagner une plus grande partie de l'émission en échange de la sécurisation du réseau.

### Comment fonctionne Audius

Sur Audius, le contenu est acheminé vers deux types de nœuds différents :

* _Content Nodes_ - Pour stocker et relayer le contenu audio (pistes, mixages, etc.) diffusé sur Audius
* _Discovery Nodes_ - Pour indexer et trier les données telles que les profils d'utilisateurs, les listes de lecture et les abonnés.

En tant qu'artiste, le téléchargement sur Audius n'est pas différent du téléchargement sur une plateforme comme Soundcloud. Mais ce qui se passe dans les coulisses, c'est ce qui rend l'Audius si unique.

Quand un artiste télécharge une piste sur Audius :

1. Ce contenu est téléchargé vers Content Node.
2. Les données sont transcodées et renvoient un code de référence utilisé pour identifier la piste.
3. Les données liées par le code de référence sont répliquées vers deux autres nœuds de contenu du réseau.
4. Une transaction onchain est publiée, signifiant que la piste existe sur Audius et que les métadonnées sont attachées au profil qui a téléchargé la piste.
5. La transaction est récupérée et indexée vers Discovery Node
6. Le client indique que la piste a été publiée avec succès lorsqu'elle apparaît sur le nœud Discovery Node, marquant ainsi la fin du téléchargement !

C'est très simple ! C'est là que le Stacking entre en jeu.

Sur d'autres plateformes, un processus similaire est mis en œuvre par la société mère, ce qui en fait le véritable propriétaire du contenu. Si cette société cesse d'exister, il en va de même pour tout le contenu stocké dans sa base de données. Avec Audius, la piste est maintenue par le réseau et contrôlée par des opérateurs de nœuds tiers et décentralisés. **Audius ne dépend pas d'une entreprise pour continuer à fonctionner.**.

**Avec le stacking de $AUDIO, vous contribuez à protéger et à renforcer le protocole.**

Cette conception permet à Audius de fonctionner en s'appuyant sur un réseau mondial d'opérateurs de nœuds tiers, plutôt que sur la seule équipe d'Audius.

La décision d'utiliser deux types de nœuds permet à Audius d'évoluer en fonction de différentes mesures, ce qui signifie que si le nombre d'auditeurs devait connaître un pic par rapport au catalogue Audius, les nœuds Discovery Node pourraient prendre le relais tandis que les nœuds de contenu Content Node continueraient à fonctionner normalement. De même, le réseau pourrait choisir d'ajuster les incitations en fonction de l'endroit où la bande passante est nécessaire pour répondre à la demande à un moment donné.

Une plateforme qui s'adapte aux besoins de ses utilisateurs !

### **Staking sur Audius**

Pour miser sur Audius, les opérateurs de nœuds peuvent mettre en place des nœuds de contenu Content Node et/ou Discovery Node en utilisant ces ressources.

https://twitter.com/Figment_io/status/1324763638729740288?s=20

Une liste de tous les opérateurs de nœuds actifs se trouve sous l'onglet [Service du tableau](https://dashboard.audius.org/services) du protocole Audius.

Les détenteurs de $AUDIO peuvent déléguer un minimum de 100 jetons à l'un de ces opérateurs de nœuds en se connectant à MetaMask ou en utilisant un coffre-fort Gnosis. Plus de détails sur la délégation seront bientôt publiés !

Les opérateurs de nœuds peuvent choisir d'exploiter un Content Node, un Discovery Node ou une combinaison des deux. La quantité de $AUDIO mise en jeu pour un opérateur donné peut être considérée comme sa bande passante économique pour faire fonctionner un ou une combinaison de services sur le réseau.

Tous les opérateurs de nœuds sont tenus de déposer **une caution personnelle minimale de 200 000 jetons AUDIO par nœud**. Alors que les Content Node et Discovery Node utilisent la même machine, les Content Node nécessitent plus de stockage et coûtent donc un peu plus cher à exploiter.

À cet effet, les paramètres de jalonnement de chaque nœud sont les suivants :

_Discovery Node_

* Minimum Bond (Stake): 200,000 AUDIO
* Maximum Bond (Stake): 7,000,000 AUDIO

_Content Node_

* Minimum Bond (Stake): 200,000 AUDIO
* Maximum Bond (Stake): 10,000,0000 AUDIO

Le stacking minimale garantit une participation suffisante au jeu, tandis que le maximum empêche le protocole de devenir trop centralisé. Les nœuds de contenu ont des exigences minimales légèrement plus élevées, c'est pourquoi ils sont en mesure d'accepter plus de stacking que les nœuds de découverte.

Chaque opérateur se voit attribuer un profil unique, permettant aux utilisateurs d'identifier son adresse, la chronologie de ses votes et les différents nœuds qu'il entretient. Les autres paramètres clés incluent :

* _Prise $AUDIO_ - Le montant total de $AUDIO misé sur tous les nœuds de l'opérateur, mesuré comme une combinaison de jetons misés ou délégués à une adresse donnée.
* _Deployer Cut_ - Le pourcentage des récompenses de stacking que les délégués paient aux opérateurs de nœuds pour jalonner $AUDIO sur leur nœud. Ceci est configurable par l'opérateur du nœud.
* _Services_ - Le nombre de noeuds uniques exécutés par un opérateur donné.
* _Délégateurs_ - Le nombre total d'adresses uniques déléguant des jetons à l'Opérateur.

Les opérateurs de nœuds peuvent également remplir leurs informations via [3Box](https://3box.io/), affichant une image de profil, titre et lien vers le site Web pour permettre aux délégués de se distinguer plus facilement des autres sur le réseau.

Audius dispose d'une période de récupération de 7 jours pour le déblocage ou l'enlèvement d'un nœud, afin de laisser suffisamment de temps pour que les nœuds soient enlevés en cas de comportement malveillant. Pendant la période de jalonnement de la genèse, les nœuds exploités par la fondation Audius verront leur coupe de déploiement fixée à 100 %, et tous les revenus seront acheminés vers une trésorerie communautaire qui sera régie par les détenteurs de jetons $AUDIO. Ces nœuds seront retirés dans un avenir proche.

### **$AUDIO Récompenses de Staking**

Audius propose un taux d'émission annuel automatique de 7% distribué sur la chaîne et sur une base hebdomadaire. Les récompenses $AUDIO sont distribuées directement sur la chaîne aux opérateurs de nœuds, le système sur la chaîne déduisant leur coupe de délégué et acheminant les récompenses restantes à ceux qui ont délégué leurs jetons.

Il est prévu que les fournisseurs de services effectuent une transaction par semaine pour distribuer l'émission pour le réseau, où les jetons peuvent être réclamés en temps réel par les opérateurs de nœuds individuels.

Dans un avenir proche, l'émission de $AUDIO commencera à être calculée à partir de l'appel de la fonction de récompense. À l'avenir, n'importe quel membre du réseau pourra appeler la fonction de récompense, les jetons étant distribués chaque semaine et pouvant être réclamés à tout moment.

Le taux, la durée et les paramètres du jalonnement de $AUDIO sont entièrement contrôlés par la gouvernance.
