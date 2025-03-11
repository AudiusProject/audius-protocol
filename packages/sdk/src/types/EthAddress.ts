import { Hex } from 'viem'
import { z } from 'zod'

export const EthAddressSchema = z.custom<Hex>((val) => {
  return z
    .string()
    .startsWith('0x', 'Hex string must start with 0x')
    .regex(
      /^0x[0-9a-fA-F]+$/,
      'Hex must only include hexadecimal characters 0-9, a-F'
    )
    .length(42, 'Ethereum address must be 42 characters (including 0x')
    .parse(val)
})
