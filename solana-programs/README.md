# Audius Solana Programs

## Create audius/solana-test-validator for development

### 1. Build the programs locally on your machine

This script will make sure to use the correct versions of Solana CLI and Anchor to build each individual program, as well as replace the program IDs with the development ones (and restore them after).

```bash
./scripts/build.sh
```

If you want, you can build the individual program you care about instead (eg. if you're creating a new program) as long as you remember to use the development keypair for it.

### 2. Build and push the image for both arm64 and amd64

The Macs we use for development use ARM64, the CI runs with AMD64.

The docker image will pull the output from the build above into it, as well as
the fixtures set up in the `./fixtures/` folder.

```bash
cd ../dev-tools/compose
docker buildx bake -f docker-compose.yml solana-test-validator --push
```

## Regenerating Fixtures

If for any reason the fixtures need to be regenerated, run the container without them (edit Dockerfile.dev and remove the fixtures from the final command, and restart the container):

```docker
CMD solana-test-validator --ledger /usr/db \
    --bpf-program ${SOLANA_AUDIUS_ETH_REGISTRY_PUBLIC_KEY} audius_eth_registry.so \
    --bpf-program ${SOLANA_TRACK_LISTEN_COUNT_PUBLIC_KEY} track_listen_count.so \
    --bpf-program ${SOLANA_CLAIMABLE_TOKENS_PUBLIC_KEY} claimable_tokens.so \
    --bpf-program ${SOLANA_REWARD_MANAGER_PUBLIC_KEY} audius_reward_manager.so \
    --bpf-program ${SOLANA_PAYMENT_ROUTER_PUBLIC_KEY} payment_router.so \
    --reset
```

Then, run:

```bash
./scripts/init-dev-fixtures.sh
```

## Adding a new program

1. Make sure to add the program's .so file to the `audius/solana-test-validator` image (Dockerfile.dev).
2. Add a `rust-toolchain` file with the version of Rust that works with your program.
3. Make sure `./scripts/update-keys.sh` can update the Program ID and key for your program.
4. Make sure `./scripts/build.sh` can build your program - make sure it loads the correct Solana and/or Anchor version before building.
5. After initializing your program, consider making fixtures of the relevant account states and adding them to the `audius/solana-test-validator` container.
