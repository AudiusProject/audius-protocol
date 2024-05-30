# @audius/spl

## 1.0.0

### Major Changes

- 75169cf: Update to use PaymentRouterProgram in @audius/spl and enable track purchase in SDK

### Patch Changes

- b65db45: Fixes RewardManagerProgram getSubmittedAttestations to account for the program padding the verified messages to 128 bytes
- b65db45: Fixes RewardManagerProgram signature parsing when service attestation signature is less than 64 bytes
- deb3f2a: Add Secp256k1Program extensions to @audius/spl to aid in decoding and debugging secp256k1 instructions
