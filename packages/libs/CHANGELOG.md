# @audius/sdk

## 5.0.0

### Major Changes

- 1b494ff: Updates target, module, and lib to ES2022 to access new features such as Error.cause, updates @solana/web3.js, and updates SolanaRelay service to throw SendTransactionError on failure
- 92d4d81: Change AntiAbuseAttestionError to AntiAbuseOracleAttestationError

### Minor Changes

- 5fe7681: Add read/write methods for Comments
- 1c61e0b: fixes a number of model definitions used in /reposts

### Patch Changes

- f75b571: fix stale signatures when auth address changes
- 9a50c42: Fix instanceof check for version mismatches of @solana/web3.js and skip preflight on evaluateAttestations
- 17904fb: Add ComputeBudget unit price instructions (priority fees) to Solana transactions
- c34cd83: Adds method to record downloads to entity manager
- ffd2ad3: add filtering support for manager endpoints
- 1ccfcd4: Allow purchase/sale filtering by track or album ID
- 975b630: Improve error messages from Claimable Tokens program
- Updated dependencies [9a50c42]
- Updated dependencies [975b630]
  - @audius/spl@1.0.1

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
