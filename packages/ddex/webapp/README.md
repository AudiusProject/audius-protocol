# Audius DDEX Web App

tRPC server and client for the Audius DDEX control layer (UI for suppliers to do OAuth and to view and manage uploads).

### Local Dev
The easiest way to test DDEX locally is via `audius-compose up --ddex-[release-by-release|batched]`. If you want to enable hot reloading for the webserver:

1. Make sure the DDEX stack is running. See `packages/ddex/README.md` for instructions on how to bring up the DDEX stack locally.
2. `cp .env.dev .env` and comment/uncomment the env vars for either release-by-release or batched choreography
2. `docker stop ddex-web-release-by-release ddex-web-batched` (assuming it's running as part of the whole DDEX stack)
3. At `packages/ddex/webapp/server`: `npm run dev:[dev|stage|prod]`
4. At `packages/ddex/webapp/client`: `npm run start:[dev|stage|prod]`
5. You can now navigate to `http://localhost:5173` to view the DDEX webapp

Notes:
* When running on stage or prod, the backend serves the frontend as static assets at the root path
