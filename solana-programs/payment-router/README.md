# Payment Router

The Payment Router program splits a single SPL token payment to multiple recipients. It is intended to be used with SPL-AUDIO and SPL-USDC. While payments can be made indepdently of the Payment Router program, it is designed to improve space-efficiency and usability off-chain.

The program derives a PDA to own tokens as an intermediary before paying out.

This program and its Anchor tests are set up to only work with the Solana mainnet cluster at the moment.

Here is the [deployed program](https://explorer.solana.com/address/paytYpX3LPN98TAeen6bFFeraGSuWnomZmCXjAsoqPa).

## Versions

Solana 1.16.1

```
solana-install init 1.16.1
solana -V
```

rustc 1.70.0

```
rustup install 1.70.0
rustup default 1.70.0
rustc -V
```

Node 18

```
nvm use
```

## Building

Make sure you have `anchor` installed. See https://www.anchor-lang.com/docs/installation. If you follow the installation steps, you should also have Rust, Solana, and Yarn installed.

Build the project.

```
anchor build
```

Anchor uses Yarn, so please sure you have it installed, and run

```
yarn install
```

## Unit tests

```
cargo test-sbf
```

## Integration tests

### Setting up your Solana cluster and environment

We are going to be invoking programs on the Solana mainnet.
So, for convenience, you can configure your cluster to use the Solana mainnet by default, and also use your chosen keypair file as the default Solana account by running:

```
./scripts/setupTestEnv.sh <fee-payer-keypair-file>
```

For example,

```
./scripts/setupTestEnv.sh id.json
```

### Testing the PDA creation

Note that the PDA has already been created, so attempting to create it again will fail. Here is [the PDA account](https://explorer.solana.com/address/8L2FL5g9y9CzAFY1471tLAXBUsupdp1kNeFuP648mqxR).

```
./scripts/testCreatePaymentRouterBalancePda.sh
```

### Testing the Routing

The following scripts will respectively send 0.0001 AUDIO / USDC tokens from the fee payer to the payment router, which will distribute it across the given recipients.

```
./scripts/testRouteAudio.sh
```

```
./scripts/testRouteUsdc.sh
```
