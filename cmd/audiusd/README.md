# audiusd

A golang implementation of the audius protocol.

## Quickstart

Minimal example to run a node and sync it to the audius mainnet.

```bash
docker run --rm -ti -p 80:80 audius/audiusd:current

open http://localhost/console/overview
```

### Run a Registered Node

To operate a [registered](https://docs.audius.org/node-operator/setup/registration/) node requires the minimal config below.
```bash
# directory for data and configuration persistence
mkdir -p ~/.audiusd
```

Content Node [override.env](https://github.com/AudiusProject/audius-docker-compose?tab=readme-ov-file#content-node-creator-node)
```bash
cat ~/.audiusd/override.env
# values are examples, replace with your own
creatorNodeEndpoint=https://cn1.operator.xyz
delegateOwnerWallet=0x07bC80Cc29bb15a5CA3D9DB9D80AcA25eB967aFc
delegatePrivateKey=2ef5a28ab4c39199085eb4707d292c980fef3dcc9dc854ba8736a545c11e81c4
spOwnerWallet=0x92d3ff660158Ec716f1bA28Bc65a7a0744E26A98
```

Discovery Node (core only) [override.env](https://github.com/AudiusProject/audius-docker-compose?tab=readme-ov-file#discovery-node-discovery-provider)
```bash
cat ~/.audiusd/override.env
# values are examples, replace with your own
audius_discprov_url=https://dn1.operator.xyz
audius_delegate_owner_wallet=0x07bC80Cc29bb15a5CA3D9DB9D80AcA25eB967aFc
audius_delegate_private_key=2ef5a28ab4c39199085eb4707d292c980fef3dcc9dc854ba8736a545c11e81c4
```

Run the node with the override.env file configuration.

```bash
docker run -d -ti --env-file ~/.audiusd/override.env -v ~/.audiusd/data:/data -p 80:80 -p 443:443 -p 26656:26656 audius/audiusd:current
```

If you are migrating from an **existing registered production node**, you will want to pay attention to the persistent volume mount point. Which will likely look something more like this:

```bash
docker run -d -ti --env-file ~/.audiusd/override.env -v /var/k8s:/data -p 80:80 -p 443:443 -p 26656:26656 audius/audiusd:current
```

## P2P Ports

Port `26656` must be open and accessible for your node to fully participate in the Audius network, enabling it to propose blocks, vote in consensus, and relay transactions to other nodes.

Without port `26656` open, the node can still download blocks and query the blockchain via RPC, but it will not participate in consensus or transaction propagation.

## TLS + Ports

TLS is enabled by default for registered nodes. LetsEncrypt is used to obtain a certificate for the node. This process takes roughly 60 seconds and occurs on the first boot only.

For this to function correctly, your service must be:
- publicly accessible via the URL specified under `creatorNodeEndpoint` or `audius_discprov_url`
- reachable on both port `80` and port `443`

**CUSTOM SETUPS**

```
# if you handle your own SSL termination, you can disable TLS
AUDIUSD_TLS_DISABLED=true

# set custom ports if needed [defaults shown]
AUDIUSD_HTTP_PORT=80
AUDIUSD_HTTPS_PORT=443
```

**CLOUDFLARE PROXY**

> TODO: Support self signed certs.

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
docker run --rm -ti -p 80:80  audius/audiusd:local
```
