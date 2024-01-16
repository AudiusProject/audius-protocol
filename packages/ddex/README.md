# Audius DDEX

NodeJS server for managing Audius bulk ingestion (DDEX uploads). Serves a frontend for uploading DDEX files at the root path (source code in `../ddex-frontend`).

### Local Dev
1. Make sure you can connect to postgres at `postgres://postgres:postgres@localhost:5432/ddex` by doing: `docker run --name ddex_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ddex -p 5432:5432 -d postgres`
2. `npm i && npm run dev:[stage|prod]`  

If you want to run the frontend locally, you'll need to:
1. Start the frontend: `cd ../ddex-frontend && npm i && npm run start:[stage|prod]`
2. If you want to test in a more prod-like manner, do `npm run [stage|prod]:preview` in the frontend directory.
  * Then you can either visit http://localhost:4173/ddex
  * OR visit the backend root path (i.e. `http://localhost:8926/ddex`) to see the frontend served as static assets from the backend. But to do this, you have to simulate the reverse proxy stripping the /ddex path prefix by commenting out `base` in the frontend `vite.config.js`. TODO: Growth area here to make it more seamless to have the backend serve the frontend locally


Notes:
* When running locally, the frontend will proxy requests to the backend at localhost:8926
* When running on stage or prod, the backend serves the frontend as static assets at the root path
* (for now) When ran on stage or prod, the app will query its local `/d_api/env` endpoint to get environment variables that are set on the node. TODO: The backend can just read these from the environment directly.
