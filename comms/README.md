# comms

You need:

* docker
* go 1.19
* make

First time:

* Ensure you have `~/go/bin` in your path
* Run `make tools`
* verify `dbmate -h` works

### Migrations

Use [dbmate](https://github.com/amacneil/dbmate):

* `dbmate new create_cool_table`

### Typings

* Update `schema/schema.ts` to add or modify type definitions
* Update `example/deno_client.ts` to use types
* Run `make quicktype`
* Update go code to use types

### running single instance

```
make reset
make
```

* if you edit go code, restart `make`
* `make psql` to psql

### running cluster

```
make cluster.up
```

start example client

```
deno run -A example/deno_client.ts
```
