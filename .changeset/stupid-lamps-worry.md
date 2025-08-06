---
'@audius/sdk': major
---

Replace getUserIDFromWallet with getUserIdsByAddresses

Replaces `sdk.users.getUserIDFromWallet` with new endpoint `sdk.users.getUserIdsByAddresses`. The old SDK version method will continue to work but is deprecated and should be replaced with the new method. The new method not only looks for associated wallets but also the user's account wallet and any claimable token accounts (user banks).

Also adds support for artist coins insights and updates the existing artist coins methods to match the backend.
