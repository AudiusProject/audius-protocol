# AudiusData <-> Anchor

### Overview:

Implementation of audius data layer in Anchor (Solana framework)

```
./cli/
    - CLI to interact with deployed instance of AudiusData, has helpers as well for reuse in shared libs layer

./lib/
    - Typescript bindings for program interaction, shared with programs/tests and cli/
    - Utils typescript located here as well

./programs/
    src/
        - Program source code deployed to blockchain
        - Single file, lib.rs

    tests/
        - Unit tests to validate program functionality
```

---

## Developing:

1. Provision a fresh dev environment (ubuntu)
2. [Install dependencies](https://project-serum.github.io/anchor/getting-started/installation.html):
```
npm run install-dev
```
3. In one terminal, run test validator: 
```
solana-test-validator
```

## Deploying:

- Build:
```
npm run build-dev
```
- Provision localnet in one shell:
```
npm run localnet-up
```
- In another shell, deploy:
```
npm run deploy-dev
```
- kill your test validator and run tests to confirm IDL:
```
npm run localnet-down && npm test
```
**Note** that if you get error logs during tests but tests still pass, you can ignore the logs.

## Sending transactions:
As a prerequisite, you should run `npm run localnet-up` and `npm run deploy-dev` to deploy your program to the solana test validator.

To deploy program and seed tx, simply run `npm run localnet-up` in one window and then run `npm run dev-setup` in another. 

See [README](cli/README.md).

## Troubleshooting:
Validate any tx:
```
solana confirm <txhash>
```

Open up logs (in a dedicated shell) - this usually has more detailed error info:
```
solana logs
```

Check balance:
```
solana balance
```

Check an account: 
```
solana account <acct-pubkey-or-path-to-storage-keypair.json>
```

Check a program:
```
solana program show <program-id>
```

Airdrop funds:
```
solana airdrop <num SOL> <pubkey-or-path-to-storage-keypair.json>
```

### Deploying to non-local cluster:
Can also specify a particular cluster at deploy time, per the following:

```
anchor deploy --provider.cluster https://audius.rpcpool.com/
Deploying workspace: https://audius.rpcpool.com/
Upgrade authority: /Users/hareeshnagaraj/.config/solana/id.json
Deploying program "audius-data"...
Program path: /Users/hareeshnagaraj/Development/audius-protocol/solana-programs/anchor/audius-data/target/deploy/audius_data.so...
Program Id: EoDXzUBiESoz9FEYdTScXgmfmzBKDRLVxgnNkFjpKtJc
```
