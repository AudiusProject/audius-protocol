# Trending Server

Runs a configuration of the comms server used to run the trending engine independently.

### Setup

This shares the same setup as comms, follow instructions for Setup [here](../README.md#setup)

### End to End Run

After setting up dependencies you should be able to run from the `/comms` dir this command:
```
alec in audius-protocol/comms on  as/trending-main [?] via  v1.19.5 on ☁️  alec@audius.co(us-central1)
❯ make trending.dev.test.full
```

You should see dependencies stand up, `ginkgo` test suite run, and then the dependencies tear down.

### Manual Runs

To run the server and tests successfully you need your dependencies up. The previous command intends to be an "all in one" package. If you want your dependencies to run long term, say for iterative development, run this command:
```
alec in audius-protocol/comms on  as/trending-main [?] via  v1.19.5 on ☁️  alec@audius.co(us-central1)
❯ make trending.dev.deps.up
```

You can then run tests or the server against it with these commands respectively:
```
alec in audius-protocol/comms on  as/plat-677-clickhouse-db-driver [?] via  v1.19.5 on ☁️  alec@audius.co(us-central1)
❯ make trending.dev.test

alec in audius-protocol/comms on  as/plat-677-clickhouse-db-driver [?] via  v1.19.5 on ☁️  alec@audius.co(us-central1)
❯ make trending.dev.run
```

Once you're done you can tear down dependencies with:
```
alec in audius-protocol/comms on  as/trending-main [?] via  v1.19.5 on ☁️  alec@audius.co(us-central1)
❯ make trending.dev.deps.down
```
