# Audius DDEX Ingester

Crawls and parses new DDEX uploads.

### Local Dev
`crawler` and `parser` are independent ingester services. Each handles a stage in the DDEX ingestion pipeline.

The easiest way to test DDEX locally is via `audius-compose up --ddex-[release-by-release|batched]`. If you want to enable hot reloading for an ingester service:

1. Make sure the DDEX stack is running. See `packages/ddex/README.md` for instructions on how to bring up the DDEX stack locally.
2. `docker stop ddex-crawler` or `docker stop ddex-parser` (assuming it's running as part of the whole DDEX stack)
3. `IS_DEV=true AWS_ENDPOINT=http://ingress:4566 DDEX_CHOREOGRAPHY=ERNReleaseByRelease air -c .air.toml -- --service [crawler|indexer|parser]`
