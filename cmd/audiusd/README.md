# audiusd

A golang implementation of the audius protocol.

## Quickstart

Minimal example to run a node and sync it to the audius mainnet.

```bash
docker run --rm -ti -p 80:80 audius/audiusd:current

open http://localhost/console/overview
```

## Run a Registered Node

To operate a [registered](https://docs.audius.org/node-operator/setup/registration/) node requires the minimal config below.

```bash
# directory for data and configuration persistence
mkdir -p ~/.audiusd

# note that as on now, only creator nodes are supported
cat <<EOF > ~/.audiusd/override.env
creatorNodeEndpoint=https://
delegateOwnerWallet=
delegatePrivateKey=
spOwnerWallet=
ENABLE_STORAGE=true
EOF

docker run -d -ti --env-file ~/.audiusd/override.env -v ~/.audiusd/data:/data -p 80:80 -p 443:443 -p 26656:26656 audius/audiusd:current
```

If you are migrating from an **existing registered production node**, you will want to pay attention to the persistent volume mount point. Which will likely look something more like this:

```bash
docker run -d -ti --env-file ~/.audiusd/override.env -v /var/k8s:/data -p 80:80 -p 443:443 -p 26656:26656 audius/audiusd:current
```

### P2P Ports

Port `26656` must be open and accessible for your node to fully participate in the Audius network, enabling it to propose blocks, vote in consensus, and relay transactions to other nodes.

Without port `26656` open, the node can still download blocks and query the blockchain via RPC, but it will not participate in consensus or transaction propagation.

### TLS

To disable TLS, set `DISABLE_TLS=true` in your environment.

TLS is enabled by default for registered nodes. The `audiusd` binary will automatically obtain a certificate using Let's Encrypt. This process takes roughly 60 seconds and occurs on the first boot only.

For this to function correctly, the following conditions must be met:
- Your service must be publicly accessible via the URL specified in the `creatorNodeEndpoint` or `audius_discprov_url` environment variable.
- Your service must be reachable on both port `:80` and port `:443`

**CLOUDFLARE PROXY**

If you are using Cloudflare Proxy, and want to use auto TLS, you will need to start with DNS-only mode:
   - Configure Cloudflare in DNS-only mode initially (not proxied)
   - Let the node obtain its LetsEncrypt certificate (requires HTTP access)
   - Once certificate is obtained, you can enable Cloudflare proxy

See Cloudflare [ssl-mode docs](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/) for more details.

## Development

```
make build-audiusd-local

# sync a local node to stage
docker run --rm -ti -p 80:80 -e NETWORK=stage  audius/audiusd:$(git rev-parse HEAD)
open http://localhost/console/overview

# network defaults to prod out of box, for an unregistered, RPC node
# tag would be "current" after this PR merges
docker run --rm -ti -p 80:80  audius/audiusd:$(git rev-parse HEAD)
```
