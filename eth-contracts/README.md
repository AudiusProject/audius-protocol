# eth-contracts

[![Coverage Status](https://coveralls.io/repos/github/AudiusProject/audius-protocol/badge.svg)](https://coveralls.io/github/AudiusProject/audius-protocol)

## Background & Architecture

Contains contracts for the Audius protocol including the ERC-20 token, staking functionality, service provider registration, delegator support and version management. For a more in depth look at the contracts and architecture, please see the [Audius Ethereum Contracts Wiki](https://github.com/AudiusProject/audius-protocol/wiki/Ethereum-Contracts-Overview) page.

## Installation

To install and run the contracts locally, clone the `audius-protocol` repo and go into the `eth-contracts` folder. If you have node.js and npm installed, run the following commands to run Ganache and migrate the contracts.

*Note* - Ganache from the command below is exposed on port 8546, not 8545.

```
npm install
npm run ganache
npm run truffle-migrate
```

## Test

To run tests, run the following command:

```
npm run test
```

## Security

Please report security issues to `security@audius.co` with a description of the vulenerability and any steps to reproduce.

## License

Apache 2.0