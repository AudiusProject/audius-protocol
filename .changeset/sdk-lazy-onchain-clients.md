---
'@audius/sdk': minor
---

Load the default ClaimableTokens, RewardManager and PaymentRouter clients and the EthereumService contracts on first use, so creating the SDK no longer loads @audius/spl, anchor or the @audius/eth ABIs up front. The public interfaces are unchanged, with two differences for the defaults: `sdk.services.ethereum.<contract>.abi` is only available after that contract has been used, and these services are no longer `instanceof` their client classes. Also marks the package as side-effect free so bundlers can drop unused exports.
