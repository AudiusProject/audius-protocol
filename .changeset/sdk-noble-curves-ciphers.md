---
'@audius/sdk': patch
---

Use @noble/curves for secp256k1 and @noble/ciphers for AES-GCM instead of @noble/secp256k1 and micro-aes-gcm. Chat and email encryption, shared secrets and signatures are byte-for-byte the same.
