Please note that this program and its anchor tests are set up to only work with the Solana mainnet cluster at the moment.

## Building the project
Make sure that the project builds
```
anchor build
```

## Testing the raydium swap
Make sure you have `anchor` installed. See https://www.anchor-lang.com/docs/installation.

## Setting up your Solana cluster
We are going to be invoking programs on the Solana mainnet.
So, for convenience, you can set up your cluster to talk to the mainnet cluster by default by running:
```
solana config set -u m
```
You are also going to need an account that will pay for the transaction fees.
The [program](https://explorer.solana.com/address/HEDM7Zg7wNVSCWpV4TF7zp6rgj44C43CXnLtpY68V7bV) is already deployed, so all your transaction fees should be very low, in the order of <0.01 SOL.
Note that you can make changes to the rust code, run `anchor build` and `anchor test`, and the redeployment will still cost very little because of the program having already been deployed.

Set up your cluster to use your chosen fee payer account (if different from your default solana config fee payer) by running:
```
solana config set -k <your-fee-payer-keypair-file>
```
This will make it so that the `solana` commands you run will be in the context of the above account. For example, you can check your SOL balance by running
```
solana balance
```
