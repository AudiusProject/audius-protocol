# @audius/sdk

## 8.0.0

### Major Changes

- b7b38ba: Rewrite authentication service to be a Viem-like AudiusWalletClient instead, and restructure the ethereum contract clients to leverage Viem more effectively.

### Minor Changes

- 993c856: getUserMonthlyTrackListens in Users API
- b8d09ab: Add uploadTrackFiles, writeTrackToChain, and generateTrackId to TracksApi
- b8d09ab: Update onProgress type to ProgressHandler
- 6322f3e: Add user/<id>/playlists and user/<id>/albums
- b0ac142: Add generatePreview and delete editFile in Storage
- a93a826: Update track upload/update metadata schema to expect numeric ids in AccessConditions
- 9c8cc61: Update full playlist.tracks response type
- b3d902b: Mutual follows method
- b0ac142: Rename `transcodePreview` -> `generatePreview` in the updateTrack params
- ba20259: Add support for new stream, download, and preview fields on tracks with mirrors
- b8d09ab: Fix signing of uploadTrack and editTrack requests

### Patch Changes

- a68bfef: Replace deprecated sign with signMessage
- 0aed18e: Move plays health back to where it was for now
- 4c89718: expose addRequestSignatureMiddleware
- 9453590: Expand accepted audio mimemtypes to audio/\*
- 9402210: move solana/web3.js to peer deps
- ea4205f: Allow 0 to be passed as previewStartSeconds
- b2b8eb7: Allow releaseDate in the future. Update zod schemas to no longer be functions
- 65fd971: Fixes for UserAuth and missing crypto method in Node environments
- 66fe1b0: Update createAppWalletClient to be object args and allow non-0x prefixed values
- 0fc1fbe: Handle empty response in uploadFile
- bec2090: deprecate Playlist.addedTimestamps
- 5303fb7: Fix concurrent getOrCreateUserBank requests
- e872cbf: Fix Wormhole Client to match typo in solidity contract (artbiter)
- 998e1f7: Fix getOrCreateUserBank failures due to low priority fees
- 7a31de8: Support different @solana/web3.js versions and add maximumMicroLamports to priority
- Updated dependencies [9402210]
- Updated dependencies [b7b38ba]
- Updated dependencies [e872cbf]
- Updated dependencies [aef5021]
  - @audius/spl@2.0.1
  - @audius/eth@0.1.0

## 7.1.0

### Minor Changes

- 5d76821: Better support for premium albums

## 7.0.0

### Major Changes

- db3f11a: BREAKING CHANGE: Removes legacy SDK ('libs') from this package.
- a2803dd: Update sdk.challenges.generateSpecifier signature

### Patch Changes

- 10668ce: Add location util
- 3f7424e: Improvements to blast upgrade flow
- 41b62a5: fix concurrency issue with addRequestSignatureMiddleware
- 3ad4d63: Chat permissions accepts permit_list
- 956a9ba: Updated services bootstrap
- 5c5bdd3: Fix purchasing tracks and albums with external wallet

## 4.2.0

### Minor Changes

- ca9fbd6: Support stem file upload in sdk

### Patch Changes

- fa19828: Update social verification
- 667037e: updates stream and download endpoints to allow specifying current user
- 3ef78ea: Remove unused user_id parameter from track history endpoint

## 4.1.0

### Minor Changes

- 15a34b3: Add getUsers and getPlaylists methods

## 4.0.0

### Major Changes

- ae044c0: Resurface aao error code when claiming audio rewards
- f005b25: Allow configuration by environment, remove config barrel file
- d9420a9: Change type filter on getUSDCTransactions to be an array rather than a single enum, to allow for multiple filters.
- 3072759: Improve AAO error handling when claiming rewards

### Minor Changes

- 276f714: Add sdk.albums.purchase()
- df0349a: added endpoints for fetching user management relationships
- 75169cf: Update to use PaymentRouterProgram in @audius/spl and enable track purchase in SDK
- 3e83e02: renames GetSupportings to GetSupportedUsers and fixes types

### Patch Changes

- 4503cc7: Using discovery relay for ACDC is not the default behavior.
- 342d610: Add ownerWallet to discovery node services, and fix getUniquelyOwnedEndpoints to use that instead of delegateOwnerWallet.
- Updated dependencies [b65db45]
- Updated dependencies [b65db45]
- Updated dependencies [deb3f2a]
- Updated dependencies [75169cf]
  - @audius/spl@1.0.0
