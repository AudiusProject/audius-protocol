---
sidebar_label: Wallet Management
sidebar_position: 1
---

# Wallet Management

Before running a service, it's important to understand wallet management. There are two kinds of wallets: "owner wallets" and "delegate wallets". Owner wallets are generally the wallets holding AUDIO tokens and are the source where tokens are staked from. "Delegate wallets" are wallets that are registered on chain and also exposed to your service via environment variables. A public key and signature is returned from each service based on the delegate wallet. The private key is never returned in responses.

The intention is to be able to verify identity of a service based on the wallet registered on chain. This allows services to prove their own identity as well as verify the identity of other nodes in the system. Having two separate wallets for holding tokens vs establishing identity keeps the separation between a wallet with value vs a functional wallet.

It's recommended that even if you have the same "owner wallet" for all your services, but use a distinct "delegate wallet" for each service.
