---
'@audius/sdk': major
'@audius/spl': major
---

Fixed bug where RewardsProgram only handled 3 total attestations in the account.
Changed IDs and specifiers for rewards claiming to be shorter so they can fit in a single Solana transaction.

To update: Update usages of `decodeAttestationsAccountData` to include `maxAttestations`, which should be `minVotes + 1` from `rewardManagerStateData`.
