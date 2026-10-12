import { PublicKey } from '@solana/web3.js'
import { z } from 'zod'

export const SolanaAddressSchema = z
  .string()
  .regex(
    /^[1-9A-HJ-NP-Za-km-z]+$/,
    'Solana address must only contain base58 characters'
  )
  .min(32, 'Solana address must be at least 32 characters')
  .max(44, 'Solana address must not exceed 44 characters')
  .refine((val) => {
    try {
      // Throws if the address is not a valid public key
      return !!new PublicKey(val)
    } catch (err) {
      console.debug(err)
      return false
    }
  })
