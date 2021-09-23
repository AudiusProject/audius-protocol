<img src="https://avatars1.githubusercontent.com/u/38231615?s=400&u=c00678880596dabd2746dae13a47edbe7ea7210e&v=4" width="150px" >

---

# audius-protocol

[![CircleCI](https://circleci.com/gh/AudiusProject/audius-protocol/tree/master.svg?style=svg&circle-token=e272a756b49e50a54dcc096af8fd8b0405f6bf41)](https://circleci.com/gh/AudiusProject/audius-protocol/tree/master)

Audius is a decentralized, community-owned music-sharing protocol and app. It provides a
censorship-resistant alternative to SoundCloud that helps artists distribute anything they
want directly to fans, creating a unique and differentiated catalog. The mission of the
project is to give everyone the freedom to share, monetize, and listen to any audio.

This repository encompasses all of the services, contracts, and client-side libraries that
comprise the Audius protocol.

For a more detailed overview of how Audius works, how these components interact with one
another, how to run an off-chain service, and more, see the [Audius protocol wiki](https://github.com/AudiusProject/audius-protocol/wiki) for more details.


## Install

The Audius protocol has many moving pieces, on-chain and off-chain. Refer to the
installation and usage instructions for any of the sub-components of the Audius protocol:

### Audius Services

These off-chain services are run by community members via the Audius staking system:

| Service                                                        | Description                                                                                       
| -- | --
| [`creator-node`](creator-node)                  | Maintains the availability of users' content on IPFS including user metadata, images, and audio content
| [`discovery-provider`](discovery-provider)      | Indexes and stores the contents of the audius contracts on the ethereum blockchain for clients to query via an API
| [`identity-service`](identity-service)          | Stores encrypted auth ciphertexts, does Twitter oauth and relays transactions on behalf of users

### Audius Smart Contracts

The independent sets of smart contracts that underpin the Audius protocol:

| Contracts                                                        | Description                                                                                       
| -- | --
| [`contracts`](https://github.com/AudiusProject/audius-protocol/tree/master/contracts)         | The POA network smart contracts for the Audius protocol, encompassing user account, content listing, and content interaction functionality
| [`eth-contracts`](https://github.com/AudiusProject/audius-protocol/tree/master/eth-contracts) | The ethereum smart contracts that run the Audius protocol, encompassing the Audius ERC20 token and functionality for staking, off-chain service registration / lookup, and governance


### Audius Client Libraries

Client-side libraries to provide a unified interface for interacting with the entire
Audius protocol:

| Library                                                        | Description                                                                                       
| -- | --
| [`libs`](https://github.com/AudiusProject/audius-protocol/tree/master/libs)     | A complete javascript interface to the Audius smart contracts and Audius services: Identity Service, Discovery Provider, Creator Node

### Audius Tools & Tests

Packages for developers to run and test Audius

| Library                                                        | Description                                                                                       
| -- | --
| [`service-commands`](https://github.com/AudiusProject/audius-protocol/tree/master/service-commands)     | Tooling to run an entire instance of Audius locally with all dependencies
| [`mad-dog`](https://github.com/AudiusProject/audius-protocol/tree/master/mad-dog)     | A system level test suite and tests for Audius

## Usage

Refer to the READMEs of the various Audius components listed above for specific usage
instructions!

## Contributing

We welcome contributions to Audius from anyone who opens a PR. Feel free to reach out to
our team [on Discord](https://discord.com/invite/yNUg2e2) or via other channels for feedback and/or support!

## Security

Please report security issues to `security@audius.co` with a description of the
vulnerability and any steps to reproduce. We have bounties available for issues reported
via responsible disclosure!

## License

Apache 2.0: [LICENSE file](https://github.com/AudiusProject/audius-protocol/blob/master/LICENSE)
