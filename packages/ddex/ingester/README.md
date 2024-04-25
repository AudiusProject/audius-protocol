# Audius DDEX Ingester

Crawls and parses new DDEX uploads.

### Local Dev
1. Make sure the DDEX dependencies are running: `audius-compose up --ddex-deps`
2. (Optional) See the webapp README to start that server and go through the OAuth flow with a staging user
3. Parse a file: `IS_DEV=true AWS_ENDPOINT=http://ingress:4566 DDEX_CHOREOGRAPHY=ERNBatched go run cmd/main.go ./e2e_test/fixtures/batch/fuga/20240305090456555 --wipe`
4. You can also run `IS_DEV=true AWS_ENDPOINT=http://ingress:4566 DDEX_CHOREOGRAPHY=ERNBatched air` to run the server with hot reloading, and then run the webapp (see its README) to click its buttons to re-parse while making code changes to the parser


### Getting files

The sync.go script is able to pull remote s3 files into local s3, provided that you have the right profile configs. See `packages/ddex/README.md` for the correct set up.

Usage:

```bash
go run ./cmd/sync s3://ddex-prod-<provider>-raw/20240305090456555

aws s3 ls s3://ddex-prod-<provider>-raw/20240305090456555 --profile local
```