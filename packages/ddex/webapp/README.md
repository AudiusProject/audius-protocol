# Audius DDEX

tRPC server and client for the Audius DDEX control layer (UI for suppliers to do OAuth and to view and manage uploads).

### Local Dev
Run the server:
1. Make sure you can connect to mongo at `mongodb://mongo:mongo@localhost:27017/ddex` by doing: `docker run --name ddex-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=mongo -e MONGO_INITDB_ROOT_PASSWORD=mongo -d mongo`
2. At the monorepo root: `npm i`
3. At packages/ddex/webapp/server: `npm run dev:[stage|prod]`  

Run the client:
If you want to run the frontend locally, you'll need to:
1. At packages/ddex/webapp/client: `npm run start:[stage|prod]`


Notes:
* When running on stage or prod, the backend serves the frontend as static assets at the root path
