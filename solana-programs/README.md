# Audius Solana Programs

`audius/solana-programs` takes about 30 mins to build. and rarely changes. As such we typically run dev via `image: audius/solana-programs:latest` in lieu of a `build` step.

## Build

If you are changing solana-programs and require a rebuild:
- uncomment the build block in [audius-protocol/dev-tools/compose/docker-compose.blockchain.yml](audius-protocol/dev-tools/compose/docker-compose.blockchain.yml)
- comment out the `image: audius/solana-programs:latest` line

This will:
- On local, promote `audius-compose up` to build the solana image for arm64
- On CI, build and push images for amd64

Once you have confirmed the build as working:
- comment out the build step
- uncomment the `image: audius/solana-programs:latest` line

This will keep subsequent local dev and CI runs fast and up to date.
