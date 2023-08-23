# Staking Bridge

This program has 2 main functions:
1. To swap SOL USDC tokens to SOL AUDIO tokens via the Raydium AMM Program.
2. To convert SOL AUDIO tokens to ETH AUDIO tokens via the Wormhole Token Bridge.

The program has a PDA (Program Derived Address) account that will own the tokens.
The program methods are permissionless, meaning that anyone can interact with them as long as they're willing to pay for the transactions.

Please note that this program and its Anchor tests are set up to only work with the Solana mainnet cluster at the moment.

Here is the [deployed program](https://explorer.solana.com/address/HEDM7Zg7wNVSCWpV4TF7zp6rgj44C43CXnLtpY68V7bV).

## Building the project
Make sure you have `anchor` installed. See https://www.anchor-lang.com/docs/installation. If you follow the installation steps, you should also have Rust, Solana, and Yarn installed.

Build the project.
```
anchor build
```

Anchor uses Yarn, so please sure you have it installed, and run
```
yarn install
```

## Running the unit tests
Use Solana 1.16.1
```
solana-install init 1.16.1
solana -V
```

and rustc 1.70.0
```
rustup install 1.70.0
rustup default 1.70.0
rustc -V
```

Run the tests
```
cargo test-bpf
```

## Setting up your Solana cluster and environment
We are going to be invoking programs on the Solana mainnet.
So, for convenience, you can configure your cluster to use the Solana mainnet by default, and also use your chosen keypair file as the default Solana account by running:
```
./scripts/setupTestEnv.sh <fee-payer-keypair-file>
```
For example,
```
./scripts/setupTestEnv.sh id.json
```

## Testing the PDA creation
Note that the PDA has already been created, so attempting to create it again will fail. Here is [the PDA account](https://explorer.solana.com/address/GwVsdGg5ZjJRzxP1wVhZBDKaS1BgdbV8sVvE4wDE36dU).
```
./scripts/testCreateStakingBridgeBalancePda.sh
```

## Testing the Raydium swap
This will swap 0.00001 USDC tokens to its AUDIO equivalent.
```
./scripts/testRaydiumSwap.sh
```

## Testing the Wormhole transfer
This will send 0.00001 AUDIO tokens to the wormhole for a given recipient to subsequently redeem.
```
./scripts/testWormholeTransfer.sh
```

## Redeeming the Wormhole tokens
There is a `scripts/redeemWormholeTokens.ts` you can use to redeem your AUDIO tokens that are in the Wormhole. You will need an eth provider url via which the transaction is sent, an eth private key to sign the transaction, and your Solana transaction ID which executed the transfer of your tokens to the Wormhole, like so:
```
ethProviderUrl=<eth-provider-url> ethPrivateKey=<eth-private-key> node scripts/redeemWormholeTokens.ts <transaction-id>
```

If you get an error redeeming the tokens, please try again a bit later.
