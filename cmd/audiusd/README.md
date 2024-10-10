# audiusd

A golang implementation of the audius protocol.

## Quickstart

Minimal example to run a node and sync it to the audius mainnet.

```bash
docker run --rm -ti -p 80:80 audius/audiusd:latest

open http://localhost/console/overview
```

## Run a Registered Node

To operate a [registered](https://docs.audius.org/node-operator/setup/registration/) node requires the minimal config below.

```bash
# directory for data persistence
mkdir ~/.audiusd

cat <<EOF > ~/.audiusd/override.env
creatorNodeEndpoint=https://
delegateOwnerWallet=
delegatePrivateKey=
spOwnerWallet=
ENABLE_STORAGE=true
EOF

docker run -d -ti --env-file ~/.audiusd/override.env -v ~/.audiusd/data:/data -p 80:80 -p 443:443 -p 26656:26656 audius/audiusd:latest
```

### P2P Ports

Port `26656` must be open and accessible for your node to fully participate in the Audius network, enabling it to propose blocks, vote in consensus, and relay transactions to other nodes.

Without port `26656` open, the node can still download blocks and query the blockchain via RPC, but it will not participate in consensus or transaction propagation.

### TLS

To enable TLS, set `ENABLE_TLS=true` in your environment. This will instruct `audiusd` to automatically obtain a certificate using Let's Encrypt. This process takes roughly 60 seconds and occurs on the first boot only.

For this to function correctly, the following conditions must be met:
- Your service must be publicly accessible via the URL specified in the `creatorNodeEndpoint` environment variable.
- Your service must be reachable on both port `:80` and port `:443`
