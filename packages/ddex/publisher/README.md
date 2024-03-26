# Audius DDEX Publisher

Server that publishes DDEX entities queued for release by the DDEX ingester.

### Local Dev
The easiest way to test DDEX locally is via `audius-compose up --ddex-[release-by-release|batched]`. If you want to enable hot reloading for the publisher:

1. Make sure the DDEX stack is running. See `packages/ddex/README.md` for instructions on how to bring up the DDEX stack locally.
2. `docker stop ddex-publisher` (assuming it's running as part of the whole DDEX stack)
3. At `packages/ddex/publisher`: `npm run dev:[dev|stage|prod]`
