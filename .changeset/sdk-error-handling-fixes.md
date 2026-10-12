---
'@audius/sdk': patch
---

Fix several error-handling bugs:

- Uploads now reject when transcode/resize polling fails, instead of never settling, and aborting an upload stops status polling right away.
- The storage node selector no longer raises an unhandled promise rejection when the node list fetch fails, and uses the refreshed node list for selection.
- The request signature middleware no longer attaches a previously cached signature after the wallet is gone (e.g. after logout) or its address changes and signing fails.
- `SolanaRelayWalletAdapter.connect()` resets `connecting` when fetching the fee payer fails.
- `SolanaRelay.relay()` rethrows the original response error when the error body isn't JSON.
- `SolanaClient.buildTransaction()` rounds the percentile-based priority fee, which previously threw on fractional values.
- Chats: a failed public key fetch is no longer cached forever, and errors handling websocket events are logged instead of becoming unhandled rejections.
