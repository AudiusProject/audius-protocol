import { toChainId, chains } from '@wormhole-foundation/sdk'
import { type Account, type Hex } from 'viem'
import { z } from 'zod'

import { EthAddressSchema } from '../../../../types/EthAddress'
import { HexSchema } from '../../../../types/Hex'
import { GasFeeSchema, type EthereumClientConfig } from '../types'

export type AudiusWormholeConfig = AudiusWormholeConfigInternal &
  EthereumClientConfig

export type AudiusWormholeConfigInternal = {
  address: Hex
}

export const TransferTokensSchema = GasFeeSchema.and(
  z.object({
    args: z.object({
      from: EthAddressSchema.optional(),
      amount: z.bigint(),
      recipientChain: z.enum(chains).transform(toChainId),
      recipient: HexSchema,
      deadline: z.bigint().optional(),
      arbiterFee: z.bigint().optional()
    }),
    account: z.custom<Account>().optional()
  })
)

export type TransferTokensParams = z.input<typeof TransferTokensSchema>
