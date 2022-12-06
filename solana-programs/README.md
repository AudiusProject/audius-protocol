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
  anchor/audius-data && anchor build
  ```
- Build the docker image
  ```
  cd audius-project
  docker compose -f docker-compose.m1.build.yml build
  ```
- You now have a working image for M1. Push to dockerhub
  ```
  # TODO audius dockerhub auth
  docker push endliine/solana-programs:m1
  ```

<!-- # Below are deprecated
## Testing
Install and configure Solana CLI to use Devnet.
### Creating entities
First create a new signer group:
```
cd cli
cargo run create-signer-group
```
Then generate a test Ethereum keypair, for example:
```
Address: 0xBCd61FAc303e9fc78fDf612A71AAa7a47a36b2d6
Private key: c8fa5fdef48a400fc1005d9e939d5b7b99b29bddd56bbd4272c40d5e38e7ca0a
```
Then create a new valid signer using created signer group and Ethereum address
```
cargo run create-valid-signer CytW3hKft44DL47PTEtvn29E8iRXchhNytxf1WEwy3Wh BCd61FAc303e9fc78fDf612A71AAa7a47a36b2d6
```
Where `CytW3hKft44DL47PTEtvn29E8iRXchhNytxf1WEwy3Wh` is signer group created on the previous step.
### Running Python Listener
```
cd python_listener
pip3 install -r requirements.txt
python3 client.py
```
Listener will start listening for the new transactions on contract address.
### Sending messages
Open new terminal window, then:
```
cd js_client
npm install
```
And try to send a message:
```
node index.js send-message FiNwLuqTdWC2ph1tk7xJzkr8mRwTYQx9rSmrEgh7TMaM c8fa5fdef48a400fc1005d9e939d5b7b99b29bddd56bbd4272c40d5e38e7ca0a "Test message" 
```
Where `FiNwLuqTdWC2ph1tk7xJzkr8mRwTYQx9rSmrEgh7TMaM` is your valid signer created with `cargo run create-valid-signer` command and `c8fa5fdef48a400fc1005d9e939d5b7b99b29bddd56bbd4272c40d5e38e7ca0a` is a private key to sign your message with.

Switch to the terminal running Python Listener. Message should appear there in a couple of seconds. -->
