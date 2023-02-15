# Storage V2

> Storage V2 is rapidly evolving within `comms` and as such uses split off infra for development
> (keeping this as platform independent as possible)

## Quickstart

One-time:
* `brew install pipx && pipx ensurepath` (installs [pipx](https://pypi.org/project/pipx/) - follow instructions there if not on macOS)
* `chmod 600 ../../dev-tools/keys/dev`

Run a multi node cluster and test uploads.

* `cd ..` (to go to the comms/ directory with the Makefile)
* run with `make storage.multi`
* visit any storage node webui at `http://node[1|2|3|4]/storage` to test uploads (ex: http://node1/storage)
* grep logs for success i.e. `docker compose logs storage1 | grep -i storing`
* to check nats stream status: `docker exec -ti com1 nats stream ls -a`
* to check weather map UI: http://node1/storage/weather
* to view nats peers (same as staging+prod): http://node1/nats/peers
* teardown with `make down`

## Development

One-time:
* `brew install pipx && pipx ensurepath` (installs [pipx](https://pypi.org/project/pipx/) - follow instructions there if not on macOS)
* `chmod 600 ../../dev-tools/keys/dev`

Run a single node cluster with hot reloading.

* run with `make storage.dev` (from the comms/ directory with the Makefile)
* teardown with `make down`
