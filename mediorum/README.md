# Mediorum

Design goals:

* Simple: only requires long lived SSE connections over http 1.1... no opening ports, no fancy protocols... not even websockets!
* Self Contained: single binary, no external dependencies... just go + sqlite3.  You can run it without docker.
* Decentralized: can run standalone with no shared infrastructure (no NATS)... a simple peer list can be used to attempt to push + pull replicas to and from other servers, but everything can work even if these operations fail.
* Flexible + Resilient: server will attempt to push replicas to peers syncronously as blobs are created.  It will use rendezvous to attempt to push to nodes in a known order, but if a push operation fails it will proceed down the list.  This behavior can happen on both the read + write paths, so the fallback behavior is built into the system from the beginning and doesn't have to be a special case.  This also means that the system can pretty easily handle alternate node sizes / read only nodes / nodes filling up or becomming unhealth without any special case stuff.
* Partition Tolerant: write operations will always work even if replication operations fail.  Periodic async repair operations will attempt to re-replicate under-replicated content
* Fast: low latency streaming CRUD operations between nodes using Server Send Events (SSE) means that when nodes are healthy the'll have reasonable database sync without loads of complexity.  A local sqlite database means that nodes know not only their own inventory but also that of their peers (who has what).. which is super useful for doing reporting + repair operations (like finding under-replicated content).
* Generally Useful: theoretically you _could_ run it outside of audius for some kind of media hosting collective I guess?  This is probably temporary as it will inevitably take on lots of audius specific quirks.


## Status + Run it

* `make tools` - installs tools (make sure `~/go/bin` is in path)
* `make` - starts single process dev cluster

* `make test`

visit `http://localhost:1991/`

with `make dev2` you can use `goreman` to start and stop servers:

* `make dev2` - starts servers as separate processes
* `goreman run stop m2`
* `goreman run start m2`

## Docker

```
docker build . -t mediorum
docker run -it -p 1991:1991 mediorum
```

## Deploy

As per [sqlite3 readme](https://github.com/mattn/go-sqlite3#cross-compiling-from-macos)
do `brew install FiloSottile/musl-cross/musl-cross`.

* `make build.fast`
