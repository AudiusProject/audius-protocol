# Storage V2

> Storage V2 is rapidly evolving within `comms` and as such uses split off infra for development
> (keeping this as platform independent as possible)

## Quickstart

Install [pipx](https://pypi.org/project/pipx/) (on macOS just run `brew install pipx && pipx ensurepath`).

Run a multi node cluster and test uploads.

* run with `make storage.multi` from the comms directory (one level up, where the Makefile lives)
* visit any storage node webui at `http://node[1|2|3|4].local/storage` to test uploads (ex: http://node1.local/storage)
* grep logs for success i.e. `docker compose logs storage1.local | grep -i storing`
* to check nats stream status: `docker exec -ti com1.local nats stream ls -a`
* to check weather map UI: http://node1.local/storage/weather
* to view nats peers (same as staging+prod): http://node1.local/nats/peers
* teardown with `make down`

## Development

Install [pipx](https://pypi.org/project/pipx/) (on macOS just run `brew install pipx && pipx ensurepath`).

Run a single node cluster with hot reloading.

* run with `make storage.dev`
* teardown with `make down`
