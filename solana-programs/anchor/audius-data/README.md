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

## Deploying:

- run `anchor build`
- get generated program public key with this cmd `solana-keygen pubkey target/deploy/audius_data-keypair.json`
- replace `declare_id!(...)` in `lib.rs` with the output of the above
- run `anchor build`
- run `anchor deploy`

Can also specify a particular cluster at deploy time, per the following:

```
anchor deploy --provider.cluster https://audius.rpcpool.com/
Deploying workspace: https://audius.rpcpool.com/
Upgrade authority: /Users/hareeshnagaraj/.config/solana/id.json
Deploying program "audius-data"...
Program path: /Users/hareeshnagaraj/Development/audius-protocol/solana-programs/anchor/audius-data/target/deploy/audius_data.so...
Program Id: EoDXzUBiESoz9FEYdTScXgmfmzBKDRLVxgnNkFjpKtJc
```
