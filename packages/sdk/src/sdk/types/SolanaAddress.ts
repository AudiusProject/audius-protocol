import { z } from 'zod'

export const SolanaAddressSchema = z.custom<string>((val) => {
  return z
    .string()
    .regex(
      /^[1-9A-HJ-NP-Za-km-z]+$/,
      'Solana address must only contain base58 characters'
    )
    .min(32, 'Solana address must be at least 32 characters')
    .max(44, 'Solana address must not exceed 44 characters')
    .parse(val)
})
