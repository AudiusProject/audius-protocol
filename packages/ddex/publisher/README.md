# Audius DDEX Publisher

Server that publishes DDEX entities queued for release by the DDEX ingester.

### Local Dev
Run the server:
1. Make sure you can connect to mongo at `mongodb://mongo:mongo@localhost:27017/ddex` by doing: `docker run --name ddex-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=mongo -e MONGO_INITDB_ROOT_PASSWORD=mongo -d mongo`
2. At the monorepo root: `npm i`
3. At packages/ddex/publisher: `npm run dev:[stage|prod]`
