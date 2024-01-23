# Audius DDEX

tRPC server and client for the Audius DDEX control layer (UI for suppliers to do OAuth and to view and manage uploads).

### Local Dev
Run the server:
1. Make sure you can connect to postgres at `postgres://postgres:postgres@localhost:5432/ddex` by doing: `docker run --name ddex_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ddex -p 5432:5432 -d postgres`
2. At the monorepo root: `npm i`
3. At packages/ddex/server: `npm run dev:[stage|prod]`  

Run the client:
If you want to run the frontend locally, you'll need to:
1. At packages/ddex/client: `npm run start:[stage|prod]`


Notes:
* When running on stage or prod, the backend serves the frontend as static assets at the root path
