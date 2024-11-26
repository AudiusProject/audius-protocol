import { keccak_256 } from '@noble/hashes/sha3'
import { secp256k1 } from '@wormhole-foundation/sdk/dist/cjs'
import { type Hex, hexToBytes, signatureToHex, numberToHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import type { AudiusAccount } from './types'

/**
 * Creates a Viem account that has sign and getSharedSecret capability from a private key.
 */
export function privateKeyToAudiusAccount(privateKey: Hex): AudiusAccount {
  const privateKeyAccount = privateKeyToAccount(privateKey)
  return {
    ...privateKeyAccount,
    source: 'custom',
    getSharedSecret: async (publicKey: string | Uint8Array) => {
      return secp256k1.getSharedSecret(hexToBytes(privateKey), publicKey)
    },
    sign: async (data: Hex) => {
      const {
        r,
        s,
        recovery: v
      } = secp256k1.sign(keccak_256(hexToBytes(data)), hexToBytes(privateKey))
      return signatureToHex({
        r: numberToHex(r),
        s: numberToHex(s),
        // Bitcoin and Ethereum add 27 arbitrarily to v by convention
        // but for legacy Audius-specific reasons, we don't do that here.
        // All the existing callsites for "sign" expect {0, 1}
        v: BigInt(v)
      })
    }
  }
}
