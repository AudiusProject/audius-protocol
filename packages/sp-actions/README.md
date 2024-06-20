## Automatic claims

This utility enables Audius Service Providers to automatically run claim operations whenever a new round is initiated.

This script can run on a recurring basis via cron and takes in two command line arguments: `spOwnerWallet` and `privateKey`.

`spOwnerWallet` - The wallet address used to register the nodes

`privateKey` - Not the private key of the `spOwnerWallet`. Should be a throwaway wallet used exclusively to claim with just enough ETH to make claims, no more than 1 ETH at any given time with an alert to top up.

Any wallet can make a claim on behalf of any node operator and their delegators and the rewards will be distributed to the node operator and the delegators inside the staking system and not to the wallet performing the claim. In order to access the claim, the node operator or delegator would have to request to undelegate.

```
# 1. Ensure npm is installed on your system

# 2. Install the actions utility
npm install -g @audius/sp-actions

# 3. Setup a cron job with the following command: (NOTE: replace <npm_prefix> with the output from 'npm config get prefix')
(crontab -l 2>/dev/null; echo "0 */6 * * * <npm_prefix>/bin/claim claim-rewards <spOwnerWallet> <privateKey>") | crontab -
```

```
Usage: claim [options] [command]

Options:
  -h, --help                                            display help for command

Commands:
  initiate-round [options] <privateKey>                 Initiates new round for claiming rewards
  claim-rewards [options] <spOwnerWallet> <privateKey>  Claim rewards for given spOwnerWallet
  help [command]                                        display help for command
```

```
Usage: claim initiate-round [options] <privateKey>

Initiates new round for claiming rewards

Options:
  --eth-registry-address <ethRegistryAddress>  Registry contract address (default: "0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C")
  --eth-token-address <ethTokenAddress>        Token contract address (default: "0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998")
  --web3-provider <web3Provider>               Web3 provider to use
  --gas <gas>                                  ammount of gas to use (default: 100000)
  --gas-price <gasPrice>                       gas price in gwei
  -h, --help                                   display help for command
```

```
Usage: claim claim-rewards [options] <spOwnerWallet> <privateKey>

Claim rewards for given spOwnerWallet

Options:
  --eth-registry-address <ethRegistryAddress>  Registry contract address (default: "0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C")
  --eth-token-address <ethTokenAddress>        Token contract address (default: "0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998")
  --web3-provider <web3Provider>               Web3 provider to use
  --gas <gas>                                  ammount of gas to use (default: 1000000)
  --gas-price <gasPrice>                       gas price in gwei
  -h, --help                                   display help for command
```
