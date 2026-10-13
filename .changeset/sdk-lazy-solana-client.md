---
'@audius/sdk': minor
---

Load @solana/web3.js on first use instead of when the SDK is created. `createSdkWithServices` now creates a lazy `solanaClient` and the Solana relay, `PublicKeySchema` and the program client defaults import @solana/web3.js only when they need it.

- Adds `solanaClient.getConnection()`, which resolves to the RPC `Connection`. Use it instead of `solanaClient.connection`.
- The default `sdk.services.solanaClient.connection` throws until the client has loaded (after any `await solanaClient.<method>()` call, including `getConnection()`), and the default `solanaClient` is no longer `instanceof SolanaClient`. A `solanaClient` passed in through `services` is used as-is.
- The default `rewardManagerClient.lookupTable` is only available once that client has loaded, unless `rewardManagerLookupTable` is passed in its config.
- `PublicKeySchema` (and schemas built on it, such as `MintSchema`) now only supports async parsing (`parseAsync`/`safeParseAsync`). The SDK's own methods already parse asynchronously.
- `SolanaAddressSchema` validates the address as base58-encoded 32 bytes without @solana/web3.js. It accepts the same strings as before.
