<p align="center">
  <br/>
  <a target="_blank" href="https://audius.co">
    <img src="./packages/web/src/assets/img/audiusLogoColor.png#gh-light-mode-only" alt="audius-client" width="200">
    <img src="./packages/web/src/assets/img/audiusLogoWhite.png#gh-dark-mode-only" alt="audius-client" width="200">
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

For details on operating an Audius service, getting started with the Token and the API, see [docs.audius.org](https://docs.audius.org/).

## Packages

| Name                                                                                            | Description                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`commands`](./packages/commands)                                                               | CLI to perform actions against the protocol                                                                                                                                           |
| [`common`](./packages/common)                                                                   | Shared code between web and mobile                                                                                                                                                    |
| [`compose`](./packages/compose)                                                                 | Defines dependencies for audius-compose                                                                                                                                               |
| [`contracts`](https://github.com/AudiusProject/audius-protocol/tree/main/contracts)             | The POA network smart contracts for the Audius protocol, encompassing user account, content listing, and content interaction functionality                                            |
| [`creator-node`](mediorum)                                                                      | Maintains the availability of users' content via the Audius Storage Protocol, including user images and audio content. Also known as Content Node or mediorum.                        |
| [`discovery-provider`](packages/discovery-provider)                                             | Indexes and stores the contents of the audius contracts on the Ethereum & Solana blockchains for clients to query via an API. Also known as Discovery Node.                           |
| [`embed`](./packages/embed)                                                                     | Embed player that renders on third party sites                                                                                                                                        |
| [`eslint-config-audius`](./packages/eslint-config-audius)                                       | Shared lint configuration                                                                                                                                                             |
| [`eth-contracts`](https://github.com/AudiusProject/audius-protocol/tree/main/eth-contracts)     | The Ethereum smart contracts that run the Audius protocol, encompassing the Audius ERC20 token and functionality for staking, off-chain service registration / lookup, and governance |
| [`harmony`](./packages/harmony)                                                                 | The Audius design system                                                                                                                                                              |
| [`identity-service`](packages/identity-service)                                                 | Stores encrypted auth ciphertexts and handles oauth artifacts                                                                                                                         |
| [`libs`](./packages/libs)                                                                       | `@audius/sdk` and legacy shared utilities `libs`                                                                                                                                      |
| [`mobile`](./packages/mobile)                                                                   | The Audius reference mobile application                                                                                                                                               |
| [`probers`](./packages/probers)                                                                 | E2E web tests                                                                                                                                                                         |
| [`solana-programs`](https://github.com/AudiusProject/audius-protocol/tree/main/solana-programs) | The Solana programs for the Audius protocol, encompassing user account, content listing, and content interaction functionality                                                        |
| [`spl`](./packages/spl)                                                                         | Handles Solana instructions for the Audius programs                                                                                                                                   |
| [`sql-ts`](./packages/sql-ts)                                                                   | A typescript database client                                                                                                                                                          |
| [`stems`](./packages/stems)                                                                     | The Audius client component library                                                                                                                                                   |
| [`trpc-server`](./packages/trpc-server)                                                         | tRPC server used for serving data                                                                                                                                                     |
| [`web`](./packages/web)                                                                         | The Audius reference web and desktop application                                                                                                                                      |

### Required Dependencies

We recommend using [homebrew](https://brew.sh/) to install the dependencies required to run Audius:

```bash
brew install nvm pyenv rbenv homebrew/cask/docker docker-compose
```

> You will need to add some shell configuration for [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating), [`pyenv`](https://github.com/pyenv/pyenv#set-up-your-shell-environment-for-pyenv), and [`rbenv`](https://github.com/rbenv/rbenv#basic-git-checkout). Please refer to the respective documentation and the installation output

### Getting Started

```bash
npm install
```

This will do the following:

- Install the correct versions of node, ruby, and python
- Install dependencies (npm packages, gems, pods, etc.)
- Set up command line tools for interacting with the protocol ([dev-tools/README.md](./dev-tools/README.md))
- Initialize git hooks

### Running the Protocol

```bash
npm run protocol
```

For more details and troubleshooting please refer to [dev-tools/README.md](./dev-tools/README.md)

### Running the Client

Environments:

- `\*:dev` runs against local services
- `\*:stage` runs against the staging testnet
- `\*:prod` runs against production infrastructure

For example:

```bash
npm run web:prod
```

For all available commands please see the [package.json scripts](https://github.com/AudiusProject/audius-protocol/blob/f850434ddca7d697f78a58d971f9bba1aba7f24d/package.json#L10) and the relevant package READMEs.

## Contributing

We welcome contributions to Audius from anyone who opens a PR. Feel free to reach out to
our team [on Discord](https://discord.gg/audius) or via other channels for feedback and/or support!

## Security

Please report security issues to `security@audius.co` with a description of the
vulnerability and any steps to reproduce. Details on our bug bounty program are available at [audius.org/security](https://audius.org/security)

## License

Apache 2.0: [LICENSE file](https://github.com/AudiusProject/audius-protocol/blob/main/LICENSE)
