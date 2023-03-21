# Audius Solana Programs

## Building on Apple [M1]

> As it stands, the `cargo build-bpf` (solana program) compiler does not link correctly when built in a Docker context on an M1 machine. 
Yet, `cargo build-bpf` compiles successfully when run on the host (OSX Darwin). Hence, we can make an image work for M1 by building the solana specific parts on the host. And everything else in the container.

- Install OSX deps
  ```
    # https://rustup.rs/
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

    # https://docs.solana.com/getstarted/local
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

    # https://www.anchor-lang.com/docs/installation
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install 0.25.0

    # yarn
    npm install -g yarn
  ```
- With a clean working directory, run `build.sh` on host, which will update the pertinent `lib.rs` files with programIDs that are deterministic for our container
  ```
  cd audius-protocol/solana-programs
  ./scripts/build.sh
  ```
- Compile the required rust targets 
  ```
  cd audius-protocol/solana-programs
  cargo build-bpf
  cd anchor/audius-data && anchor build
  ```
- Build the docker image
  ```
  cd audius-protocol
  docker compose -f docker-compose.m1.build.yml build
  ```
- You now have a working image for M1. Push to dockerhub
  ```
  docker push audius/solana-programs:m1-latest
  ```
