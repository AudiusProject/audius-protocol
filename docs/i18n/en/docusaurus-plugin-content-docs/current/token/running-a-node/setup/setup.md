---
sidebar_label: Setup Instructions
sidebar_position: 3
---

# Setup Instructions

This guide describes how to run Audius services on a single machine via Docker Compose.
The repository of Docker Compose files can be found on [GitHub](https://github.com/AudiusProject/audius-docker-compose).

Please join the node operator discord channel on the [Audius discord server](https://discord.com/invite/audius) for announcements & troubleshooting assistance.

## Wallet Management

Before running a service, it's important to understand wallet management. There are two kinds of wallets: "owner wallets" and "delegate wallets". Owner wallets are generally the wallets holding AUDIO tokens and are the source where tokens are staked from. "Delegate wallets" are wallets that are registered on chain and also exposed to your service via environment variables. A public key and signature is returned from each service based on the delegate wallet. The private key is never returned in responses.

The intention is to be able to verify identity of a service based on the wallet registered on chain. This allows services to prove their own identity as well as verify the identity of other nodes in the system. Having two separate wallets for holding tokens vs establishing identity keeps the separation between a wallet with value vs a functional wallet.

It's recommended that even if you have the same "owner wallet" for all your services, but use a distinct "delegate wallet" for each service.

## Installation

On a VM that meets the minimum requirements from above run:

```bash
bash <(curl https://raw.githubusercontent.com/AudiusProject/audius-docker-compose/main/install.sh)
```

During installation there will be prompts for required environment variables. The variables are:

### Creator Node

- `creatorNodeEndpoint` - The DNS of your content node. If you haven't registered the service yet, please enter the url you plan to register.
- `delegateOwnerWallet` - Address of wallet that contains no tokens but that is registered on chain, used to sign JSON responses from server
- `delegatePrivateKey` - Private key associated with `delegateOwnerWallet`
- `spOwnerWallet` - Wallet that registered (or will register) the content node on chain

If you're using an externally managed Postgres DB please see [this section](advanced_setup.md#external-creator-node-postgres)

### Discovery Provider

- `audius_delegate_owner_wallet` - Address of wallet that contains no tokens but that is registered on chain, used to sign JSON responses from server
- `audius_delegate_private_key` - Private key associated with `audius_delegate_owner_wallet`

If you're using an externally managed Postgres DB please see [this section](advanced_setup.md#external-discovery-provider-postgres-instance)

### More options

For more advanced configuration options or migrating from Kubernetes check out the [Advanced Setup Guide](advanced_setup.md)

## Registering a service

**NOTE** - Registering a node requires a minimum of 200,000 AUDIO tokens per node. There is a grant system to support nodes on the network, reach out [here](https://docs.google.com/forms/d/e/1FAIpQLSf91KZdBdDlJrx6nLR3k6g4uL0PSg9QuR4FxMabEI6gGdlA6A/viewform) once you have a node running if you'd like to apply for a grant.

Please join the node operator discord channel on the [Audius discord server](https://discord.com/invite/audius) for announcements & troubleshooting assistance.

One your node is running and your tokens have been distributed, visit https://dashboard.audius.org with MetaMask configured with the wallet that stores your $AUDIO tokens.

1. Click on `Services`
2. Click the `Register New Service` button (If you don't see this button, make sure Metamask is configured with Eth Mainnet and you have connected it to the dashboard site). You will need to be connected to the dashboard with your Service Provider Owner Wallet Address (not a delegate address).
3. Select whether you're trying to register a `Content Node` (formerly `Creator Node`) or `Discovery Node` (formerly `Discovery Provider`)
4. Enter a `Staking Amount`
5. Enter a fully qualified domain name in the url bar
6. Enter a `Delegate Wallet Address`. This is different from the wallet containing your AUDIO tokens. By default, this field will be populated if you wish to use your Service Provider Owner Wallet Address for your Delegate Wallet, however it is strongly advised not to. That way your Service Provider Wallet stays isolated.
7. Click the `Register <Service type>` button

### Claming staking rewards

Claims can be made via https://dashboard.audius.org by visiting the page for your service. If a claim is available, a "Claim" button will be displayed that allows you to submit the claim transaction.
