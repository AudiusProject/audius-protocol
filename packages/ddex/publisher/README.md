# Audius DDEX Publisher

Server that publishes DDEX entities queued for release by the DDEX ingester.

### Local Dev
Setup:
Make sure you've configured your `packages/ddex/.env` and S3 buckets according to the toplevel DDEX README.

Run the server:
1. Make sure you can connect to mongo at `mongodb://mongo:mongo@localhost:27017/ddex`. See `packages/ddex/README.md` on how to spin up `ddex-mongo` and the other ddex containers.
2. At the monorepo root: `npm i`
3. At packages/ddex/publisher: `npm run dev:[dev|stage|prod]`
