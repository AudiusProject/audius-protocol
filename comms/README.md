# comms

You need:

* docker
* go 1.19
* make

First time:

* Ensure you have `~/go/bin` in your path
* Run `make tools`
* verify `dbmate -h` works

### running single instance

```
make reset
make
```

* if you edit go code, restart `make`
* `make psql` to psql


### Migrations

Use [dbmate](https://github.com/amacneil/dbmate):

* `dbmate new create_cool_table`
* `make db.jet`


### Typings

* Update `schema/schema.ts` to add or modify type definitions
* Update `example/deno_client.ts` to use types
* Run `make quicktype`
* Update go code to use types

### running cluster

```
make cluster.up
```

start example client

```
go run example/go_client.go
```

or

```
deno run -A example/deno_client.ts
```
