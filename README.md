<p align="center">
  <br/>
  <a target="_blank" href="https://audius.co">
    <img src="https://user-images.githubusercontent.com/2731362/90302695-e5ae8a00-de5c-11ea-88b5-24c1408affc6.png" alt="audius-client" width="200">
  </a>
  <br/>

  <p align="center">
    The Audius Monorepo
    <br/>
    🎧🎸🎹🤘🎶🥁🎷🎻🎤🔊
  </p>
</p>

<br/>
<br/>

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/AudiusProject/audius-protocol/tree/main.svg?style=svg&circle-token=7813cfa60dbb92905f7fa2979eced3e33f1d77af)](https://dl.circleci.com/status-badge/redirect/gh/AudiusProject/audius-protocol/tree/main)

Audius is a decentralized, community-owned music-sharing protocol

test

For further details on operating an Audius service, getting started with the Token and the API, see [docs.audius.org](https://docs.audius.org/).

## Apps

| Name                          | Description                            |
| ----------------------------- | -------------------------------------- |
| [`web`](./packages/web)       | The Audius web and desktop application |
| [`mobile`](./packages/mobile) | The Audius mobile application          |

## Packages

| Name                                                      | Description                         |
| --------------------------------------------------------- | ----------------------------------- |
| [`stems`](./packages/stems)                               | The Audius client component library |
| [`common`](./packages/common)                             | Shared code between web and mobile  |
| [`eslint-config-audius`](./packages/eslint-config-audius) | Shared lint configuration           |

### Required Dependencies

The following dependencies are required to run the Audius client:

```
node python ruby
```

`npm install` will fail if they are not met. We recommend [homebrew](https://brew.sh/), [pyenv](https://github.com/pyenv/pyenv), and [rbenv](https://github.com/rbenv/rbenv). Don't forget to follow the instructions in the install command output (eg. adding things to your `.zshrc` or `bashrc` file).

```
brew install nvm pyenv rbenv

nvm install
pyenv install
rbenv install
```

### Getting Started

After cloning run:

```bash
npm install
```

This will do the following:

- Check you have the correct versions of node, ruby, and python
- Install root dependencies
- Install all package dependencies
- Initialize git hooks (`npx @escape.tech/mookme init --only-hook --skip-types-selection`)
- Install ios pods

### Running A Client

Environments:

- \*:dev runs against local services
- \*:stage runs against the staging testnet
- \*:prod runs against production infrastructure

```bash
# web
npm run web:dev
npm run web:stage
npm run web:prod

# desktop
npm run desktop:dev
npm run desktop:stage
npm run desktop:prod

# mobile

# ios
npm run ios:dev
npm run ios:stage
npm run ios:prod
# on a physical device
xcrun xctrace list devices
npm run ios:<env> -- --device "My iPhone"

# android
npm run android:dev
npm run android:stage
npm run android:prod
# on a physical device
adb devices
npm run android:<env> -- --device "A38M608KHBK"

# stems in watch mode
npm run stems

# common in watch mode
npm run common

# lint and typecheck
npm run verify
```

## Overview

### Audius Services

These off-chain services are run by community members via the Audius staking system:

| Service                                    | Description                                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`creator-node`](mediorum)                 | Maintains the availability of users' content via the Audius Storage Protocol, including user images and audio content. Also known as Content Node or mediorum. |
| [`discovery-provider`](discovery-provider) | Indexes and stores the contents of the audius contracts on the Ethereum & Solana blockchains for clients to query via an API. Also known as Discovery Node.    |
| [`identity-service`](identity-service)     | Stores encrypted auth ciphertexts and handles oauth artifacts                                                                                                  |

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

| Library                                                                            | Description                                                                                                                           |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [`libs`](https://github.com/AudiusProject/audius-protocol/tree/main/packages/libs) | A complete javascript interface to the Audius smart contracts and Audius services: Identity Service, Discovery Provider, Creator Node |

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
