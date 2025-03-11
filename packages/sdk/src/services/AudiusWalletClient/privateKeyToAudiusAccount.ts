import { keccak_256 } from '@noble/hashes/sha3'
import * as secp256k1 from '@noble/secp256k1'
import { type Hex, hexToBytes } from 'viem'
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
      return secp256k1.getSharedSecret(hexToBytes(privateKey), publicKey, true)
    },
    signRaw: async (data: Hex) => {
      return secp256k1.sign(
        keccak_256(hexToBytes(data)),
        hexToBytes(privateKey),
        { recovered: true, der: false }
      )
    }
  }
}
