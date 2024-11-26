import type { Account, Hex } from 'viem'
import { z } from 'zod'

import { EthAddressSchema } from '../../../../types/EthAddress'
import { GasFeeSchema, type EthereumClientConfig } from '../types'

export type AudiusTokenConfig = AudiusTokenConfigInternal & EthereumClientConfig

export type AudiusTokenConfigInternal = {
  address: Hex
}

export const PermitSchema = GasFeeSchema.and(
  z.object({
    args: z.object({
      owner: EthAddressSchema.optional(),
      spender: EthAddressSchema,
      value: z.bigint(),
      deadline: z.bigint().optional()
    }),
    account: z.custom<Account>().optional()
  })
)

export type PermitParams = z.input<typeof PermitSchema>
