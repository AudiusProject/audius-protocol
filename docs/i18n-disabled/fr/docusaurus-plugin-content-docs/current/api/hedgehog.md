---
sidebar_label: Hedgehog
sidebar_position: 2
---

# Hedgehog

Construire des DApps comme des applications

[Github](https://github.com/AudiusProject/hedgehog) 👈

Hedgehog est un portefeuille Ethereum open-source côté client, qui utilise un nom d'utilisateur et un mot de passe. Il vise à réduire la barrière d'entrée aux projets de crypto-monnaies pour les utilisateurs qui ne sont pas familiers avec la technologie. Il vise à réduire la barrière d'entrée aux projets de crypto-monnaies pour les utilisateurs qui ne sont pas familiers avec la technologie.

Permettre aux utilisateurs d'interagir avec votre DApp comme ils le feraient avec n'importe quel autre site web, sans extension, sans centralisation du contrôle des clés.

Hedgehog est une alternative à Metamask qui gère la clé privée et le portefeuille d'un utilisateur sur le navigateur. Il expose une Api simple qui vous permet de créer un schéma d'authentification pour que les utilisateurs puissent s'inscrire et se connecter à leur portefeuille sur plusieurs navigateurs et appareils.

### Toutes les transactions ne sont pas égales

Les portefeuilles Ethereum actuels traitent chaque transaction comme s'il s'agissait de transférer les économies de toute une vie. Hedgehog a été construit pour des cas d'utilisation impliquant une valeur financière faible à nulle.

> Remarque : la principale amélioration de l'expérience de l'utilisateur final est gagnée en masquant la complexité du portefeuille et en n'obligeant pas les utilisateurs à confirmer les transactions - le contraire de ce que vous souhaitez lorsque vous déplacez des sommes importantes.

#### Plus de popups 🦊

Aujourd'hui, les applications décentralisées nécessitent de nombreuses connaissances techniques pour être configurées et utilisées, ce qui limite votre base d'utilisateurs et réduit votre potentiel de croissance.

### Installation

```bash
npm i --save @audius/hedgehog
```

### Documentations et exemples

Consultez la [documentation](http://audiusproject.github.io/hedgehog-docs) technique complète et le mode d'emploi de [api how-to](http://audiusproject.github.io/hedgehog-docs#how-to).

Pour une démonstration rapide côté navigateur, [ne cherchez pas plus loin](https://codesandbox.io/embed/pp9zzv2n00). Pour une démonstration complète de l'authentification de bout en bout, consultez notre [dépôt ](https://github.com/AudiusProject/audius-hedgehog-demo).

### Pourquoi l'utiliser ?

#### Toutes les transactions ne sont pas égales

Les portefeuilles actuellement disponibles traitent chaque transaction comme s'il s'agissait des économies d'une vie. Hedgehog a été conçu pour des cas d'utilisation impliquant une valeur financière faible ou nulle.

**REMARQUE**: La principale amélioration de l'expérience de l'utilisateur final consiste à masquer la complexité du portefeuille et à ne pas obliger les utilisateurs à confirmer constamment les transactions - le contraire de ce que vous souhaitez lorsque vous déplacez des sommes importantes.

#### Hedgehog est-il la solution idéale pour votre DApp ?

Hedgehog ne convient pas à toutes les applications numériques. Les améliorations massives de l'expérience utilisateur ne sont possibles qu'en faisant des compromis. En règle générale, Hedgehog ne devrait pas être utilisé pour des applications qui impliquent des sommes importantes. En guise de passerelle, on pourrait faire démarrer les utilisateurs sur Hedgehog et leur suggérer de migrer vers un portefeuille plus sécurisé si leur valeur stockée augmente au-delà d'un certain seuil ; le paradigme Hedgehog est également interopérable avec les fournisseurs web3 existants.

_\[Bon cas d'utilisation\]_

* . Signature des données : Si vous construisez des applications décentralisées qui reposent sur des données signées par l'utilisateur (par exemple, via des schémas de signature de type EIP-712), Hedgehog pourrait simplifier l'expérience si les enjeux sont suffisamment faibles.
* . DApp de jeu : Rien ne gâche autant le plaisir que de signer des transactions. Si vous construisez une DApp de jeu qui n'utilise pas d'actifs financiers importants, l'amélioration de l'UX est essentielle.
* . Lecteur de musique décentralisé : Si vous créez des applications numériques destinées aux consommateurs, Hedgehog améliorera considérablement l'expérience utilisateur et augmentera de façon significative votre base d'utilisateurs potentiels.

_\[Cas d'utilisation incorrect\]_

Si votre DApp implique le déplacement d'importantes sommes d'argent, le compromis en matière de sécurité n'en vaut probablement pas la peine. La principale amélioration apportée par Hedgehog à l'expérience de l'utilisateur final consiste à masquer le portefeuille et à ne pas obliger les utilisateurs à confirmer les transactions, ce qui est à l'opposé de ce que vous souhaitez lorsque vous déplacez de l'argent.  Nous ne recommandons absolument pas l'utilisation de Hedgehog dans des situations comme celles-ci :

* **DApp bancaire**
* **Prêts décentralisés**
* **Marchés de prédiction**

### Un regard plus approfondi

Hedgehog est un paquet qui se trouve dans votre application front-end pour créer et gérer l'entropie d'un utilisateur (à partir de laquelle une clé privée est dérivée). Hedgehog s'appuie sur un nom d'utilisateur et un mot de passe pour créer des artefacts d'authentification. Il est donc capable de simuler un système d'authentification familier qui permet aux utilisateurs de s'inscrire ou de se connecter à partir de plusieurs navigateurs ou appareils et de récupérer leur entropie. Ces artefacts, via hedgehog, sont persistés dans un backend de votre choix.

**REMARQUE** : La clé privée est uniquement calculée et disponible côté client et n'est jamais transmise ou stockée ailleurs que dans le navigateur de l'utilisateur.

```javascript
// Provide getFn, setAuthFn, setUserFn as requests to your database/backend service (more details in docs).
const hedgehog = new Hedgehog(getFn, setAuthFn, setUserFn)
let wallet
if (hedgehog.isLoggedIn()) {
  wallet = hedgehog.getWallet()
} else {
  wallet = await hedgehog.login('username', 'password')
  // or
  wallet = await hedgehog.signUp('username', 'password')
}
```

Après avoir créé ou récupéré le portefeuille d'un utilisateur, vous pouvez soit **approvisionner directement leur portefeuille** pour payer des frais de transaction ou **relayer leurs transactions via un relais EIP-712**.


### 👉 [ Plonger plus en profondeur dans la documentation ](https://audiusproject.github.io/hedgehog-docs/#installation) 👈
