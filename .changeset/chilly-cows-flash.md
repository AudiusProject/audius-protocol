---
'@audius/sdk': patch
---

Update Solana program clients to require `bigint` amounts

Instead of relying on a mapping to preconfigured mints and using
`@audius/fixed-decimal`, the Solana program clients are updated to support
arbitrary mints.
