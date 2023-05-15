<p align="center">
  <br/>
  <a target="_blank" href="https://audius.co">
    <img src="https://user-images.githubusercontent.com/2731362/90302695-e5ae8a00-de5c-11ea-88b5-24c1408affc6.png" alt="audius-client" width="200">
  </a>
  <br/>

  <p align="center">
    The Audius Protocol Monorepo
    <br/>
    🎧🎸🎹🤘🎶🥁🎷🎻🎤🔊
  </p>
</p>

<br/>
<br/>

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/AudiusProject/audius-protocol/tree/main.svg?style=svg&circle-token=7813cfa60dbb92905f7fa2979eced3e33f1d77af)](https://dl.circleci.com/status-badge/redirect/gh/AudiusProject/audius-protocol/tree/main)

Audius is a decentralized, community-owned music-sharing protocol

This repository encompasses all of the services, contracts, and client-side libraries that
comprise the Audius protocol.

For further details on operating an Audius service, getting started with the Token and the API, see [docs.audius.org](https://docs.audius.org/).

## Overview

### Audius Services

These off-chain services are run by community members via the Audius staking system:

| Service                                    | Description                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`creator-node`](creator-node)             | Maintains the availability of users' content via the Audius Storage Protocol, including user metadata, images, and audio content. Also known as Content Node. |
| [`discovery-provider`](discovery-provider) | Indexes and stores the contents of the audius contracts on the Ethereum & Solana blockchains for clients to query via an API. Also known as Discovery Node.   |
| [`identity-service`](identity-service)     | Stores encrypted auth ciphertexts and handles oauth artifacts                                                                                                 |

### Smart Contracts & Programs

The independent sets of smart contracts that power the on-chain aspects of the Audius protocol:

| Contracts                                                                                       | Description                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`eth-contracts`](https://github.com/AudiusProject/audius-protocol/tree/main/eth-contracts)     | The Ethereum smart contracts that run the Audius protocol, encompassing the Audius ERC20 token and functionality for staking, off-chain service registration / lookup, and governance |
| [`solana-programs`](https://github.com/AudiusProject/audius-protocol/tree/main/solana-programs) | The Solana programs for the Audius protocol, encompassing user account, content listing, and content interaction functionality                                                        |
| [`contracts`](https://github.com/AudiusProject/audius-protocol/tree/main/contracts)             | The POA network smart contracts for the Audius protocol, encompassing user account, content listing, and content interaction functionality                                            |

### Audius Client Libraries

Client-side libraries to provide a unified interface for interacting with the entire
Audius protocol:

| Library                                                                   | Description                                                                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [`libs`](https://github.com/AudiusProject/audius-protocol/tree/main/libs) | A complete javascript interface to the Audius smart contracts and Audius services: Identity Service, Discovery Provider, Creator Node |

## Development

### Prerequisites

- Install docker & docker-compose [https://docs.docker.com/get-docker](https://docs.docker.com/get-docker)
- Install rust https://rustup.rs/
- Install nvm & node (v14.17.5) https://github.com/nvm-sh/nvm

### Running the protocol

Refer to [dev-tools/README.md](./dev-tools/README.md)

## Contributing

We welcome contributions to Audius from anyone who opens a PR. Feel free to reach out to
our team [on Discord](https://discord.gg/audius) or via other channels for feedback and/or support!

## Security

Please report security issues to `security@audius.co` with a description of the
vulnerability and any steps to reproduce. Details on our bug bounty program are available at [audius.org/security](https://audius.org/security)

## License

Apache 2.0: [LICENSE file](https://github.com/AudiusProject/audius-protocol/blob/main/LICENSE)
