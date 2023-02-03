# comms

Builds a single binary with three main entrypoints:

* nats - handles setuping cluster in staging / prod based on nodes registered on mainnet eth contract
  this is not needed in dev where you can start a single instance vanilla NATS server.
* discovery - runs on discovery nodes, reads + writes to discovery database.  Currently used for DMs.
* storage - runs on content nodes.

### Setup

You need:

* docker
* go 1.19
* make

Verify setup:

* Ensure you have `~/go/bin` in your path
* Run `make tools`
* verify `dbmate -h` works

### Run + test

* `make reset` - starts postgres + nats containers (first time)
* `make` - dev on discovery
* `make dev.storage` - dev on storage (make sure a JetStream-enabled NATS server is running first with `nats-server -p 4222 -js`)
* `make test`

Re-run make after code changes

### Migrations

Use [dbmate](https://github.com/amacneil/dbmate):

* `cd discovery && dbmate new create_cool_table`
* edit migration file
* `make reset` to run migration

### Typings

* Update `audius-protocol/libs/src/sdk/api/chats/serverTypes.ts` to add or modify type definitions
* Run `make quicktype`
* Update go code to use types

### Deploy to Staging

Currently docker build + push is done locally and some bash scripts are used to launch on staging machines.

* Authenticate on Dockerhub
* `bash bash_scripts/deploy.sh`

### Storage V2 Dev

> Storage V2 is rapidly evolving within `comms` and as such uses split off infra for development
> (keeping this as platform independent as possible)

* run with `docker compose -f docker-compose.v2.yml up -d --build`
* visit any storage node webui at `http://0.0.0.0:992[4|5|6|7]/storage` to test uploads
* grep logs for success i.e. `docker compose logs storage1 | grep -i storing`
* to check nats stream status `docker exec -ti com1 nats stream ls -a`
* teardown `docker compose -f docker-compose.v2.yml down -v`
