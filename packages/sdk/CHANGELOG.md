# @audius/sdk

## 7.1.1

### Patch Changes

- Updated dependencies [aef5021]
  - @audius/eth@0.0.1

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
