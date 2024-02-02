# Audius DDEX Ingester

Indexes and parses new DDEX uploads.

### Local Dev
`crawler`, `indexer`, and `parser` are independent services. Each handles a stage in the DDEX ingestion pipeline.

To run an ingester service locally:
1. Make sure you can connect to mongo at `mongodb://mongo:mongo@localhost:27017/ddex`. See `packages/ddex/README.md` on how to spin up `ddex-mongo` and the other ddex containers.
2. In `cmd/`: `go build`
3. `./cmd --service [crawler|indexer|parser]`
