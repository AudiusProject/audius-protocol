import { z } from 'zod'

import { EthAddressSchema } from './EthAddress'
import { SolanaAddressSchema } from './SolanaAddress'

export const ChainAddressSchema = z.discriminatedUnion('chain', [
  z.object({
    chain: z.literal('sol'),
    address: SolanaAddressSchema
  }),
  z.object({
    chain: z.literal('eth'),
    address: EthAddressSchema
  })
])

export type ChainAddress = z.infer<typeof ChainAddressSchema>
