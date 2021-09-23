# Audius Data Contracts
This repository contains the smart contracts for account, user and content management. These are currently deployed to the POA network blockchain.

## First Time Setup

Execute in repository root directory

```
npm install
```


## Prepare local blockchain for development

Install docker from here (macOS, or your machine appropriate version)

https://docs.docker.com/install

run ``` docker ``` in your terminal application to confirm the installation

Ensure the docker daemon is running, it can be started from either the command line or
through the docker macOS GUI - https://docs.docker.com/docker-for-mac/install/#install-and-run-docker-for-mac

Pull the trufflesuite/ganche-cli container to your local box:

```
docker pull trufflesuite/ganache-cli 
```

In a dedicated console window, execute the following command to bring up the container:

```
$ npm run ganache

> audius-contracts@1.0.0 ganache /Development/audius-contracts
> docker run --name audius_ganache_cli -d -p 8545:8545 trufflesuite/ganache-cli:latest -h 0.0.0.0 -l 8000000

b35518d9f0982faafb228ed4e13f5d811de35111dbf90834a86a6f19d7190b1b
```

Execute the following command to kill the container:
```
$ npm run ganache-q

> audius-contracts@1.0.0 ganache-q /Development/audius-contracts
> docker rm -f audius_ganache_cli > /dev/null
```

Logs can be inspected with the following command - this is useful for debugging during contract
development

```
$ docker logs audius_ganache_cli
```

## Development Console

Migrate contracts and enter truffle console. 

```
npm run truffle-migrate 
 
npm run truffle-console 
```


Sample commands:


    > UserFactory.deployed().then(inst => cf = inst)
    >
    > TrackFactory.deployed().then(inst => tf = inst)
    >
    > cf.createUser('sid')
    >
    > tf.setUserFactoryContractAddress(cf.address)
    >
    > tf.createTrack(0, 'track_key_0')



## Running Truffle Unit Tests


Execute the following from root directory to run all tests

```
npm run truffle-test 
```


Execute the following to run a specific test 

```
npm run truffle-test <path to test file>
```

```
npm run truffle-test test/user.js
```

Add the '-v' flag to enable verbose output

```
npm run truffle-test-v
```

## Code Formatting
### Enable repo-level linting for contract files

Linting is performed prior to execution of the truffle-test commands. To just run the solium linter:

```
npm run lint
```

If a permissions update for the shell script is required, run the following command (appending "sudo" if necessary):

```
chmod +x scripts/lint-contracts.sh
```

Note that the linter will **not break** any compilation due to errors, and is intended as a **guideline** at this time

Only applies to solidity (.sol) files

## Links

EIP-712 compliant signature generation and signature validation (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md)