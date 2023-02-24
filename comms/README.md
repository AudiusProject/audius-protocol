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

* `make` - dev on discovery or storage (view logs with `docker logs -f discovery1` or `docker logs -f storage1`)
* `make test` - view test output (tests run automatically when changing files)
* the above both hot reload, so you don't need to do `make` again unless you break hot reloading (e.g., creating/deleting files)

Re-run make after code changes

### Migrations

Use [dbmate](https://github.com/amacneil/dbmate):

* `cd discovery && dbmate new create_cool_table`
* edit migration file
* `make migrate` to run migration

### Typings

* Update `audius-protocol/libs/src/sdk/api/chats/serverTypes.ts` to add or modify type definitions
* Run `make quicktype`
* Update go code to use types

### Deploy to Staging

Currently docker build + push is done locally and some bash scripts are used to launch on staging machines.

* Authenticate on Dockerhub
* `bash bash_scripts/deploy.sh`

## Storage

See [storage/README.md](./storage/README.md)
