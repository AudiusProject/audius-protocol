# Storage V2

> Storage V2 is rapidly evolving within `comms` and as such uses split off infra for development
> (keeping this as platform independent as possible)

## Quickstart

Run a multi node cluster and test uploads.

* run with `docker compose -f docker-compose.v2.yml up -d --build`
* visit any storage node webui at `http://0.0.0.0:992[4|5|6|7]/storage` to test uploads
* grep logs for success i.e. `docker compose logs storage1 | grep -i storing`
* to check nats stream status `docker exec -ti com1 nats stream ls -a`
* teardown `docker compose -f docker-compose.v2.yml down -v`

## Development

Run a single node cluster with hot reloading.

* `docker compose -f docker-compose.v2.dev.yml up -d --build`
