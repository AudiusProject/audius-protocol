import { base58 } from '@scure/base'
import { z } from 'zod'

/**
 * Whether `value` is a base58-encoded 32-byte Solana public key. Matches what
 * `new PublicKey(value)` accepts, without loading @solana/web3.js.
 */
export const isSolanaPublicKeyString = (value: string) => {
  try {
    return base58.decode(value).length === 32
  } catch {
    return false
  }
}

export const SolanaAddressSchema = z
  .string()
  .regex(
    /^[1-9A-HJ-NP-Za-km-z]+$/,
    'Solana address must only contain base58 characters'
  )
  .min(32, 'Solana address must be at least 32 characters')
  .max(44, 'Solana address must not exceed 44 characters')
  .refine(isSolanaPublicKeyString)
