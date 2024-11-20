# audiusd

A golang implementation of the audius protocol.

## Quickstart

Minimal example to run a node and sync it to the audius mainnet.

```bash
docker run --rm -ti -p 80:80 audius/audiusd:current

open http://localhost/console/overview
```

## Run a Registered Node

To operate a [registered](https://docs.audius.org/node-operator/setup/registration/) node requires minimal configuration.

```bash
mkdir -p ~/.audius/contexts/

cat <<EOF > ~/.audius/contexts/default
local:
  hostname: myaudiusnode.example.com
  privateKey: <your-private-key>
  wallet: <your-wallet>
  rewardsWallet: <your-wallet>
EOF
```

### Run Containerless

[Download](https://github.com/AudiusProject/audius-protocol/releases) and run audiusd

```bash
./audiusd
```

### Run via Docker

```bash
docker run -d -ti -v ~/.audius:/audius -p 80:80 -p 443:443 -p 26656:26656 audius/audiusd:current
```

## P2P Ports

Port `26656` must be open and accessible for your node to fully participate in the Audius network, enabling it to propose blocks, vote in consensus, and relay transactions to other nodes.

Without port `26656` open, the node can still download blocks and query the blockchain via RPC, but it will not participate in consensus or transaction propagation.

## TLS

To enable TLS, set `autoTLS: true` in your config. This will instruct `audiusd` to automatically obtain a certificate using Let's Encrypt. This process takes roughly 60 seconds and occurs on the first boot only.

For this to function correctly, the following conditions must be met:
- Your service must be publicly accessible via the host specified in the `hostname` config.
- Your service must be reachable on both port `:80` and port `:443`
