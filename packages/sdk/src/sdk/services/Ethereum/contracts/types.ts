import { PublicClient, type Transport, type WalletClient } from 'viem'
import type { mainnet } from 'viem/chains'
import { z } from 'zod'

import { SdkServicesConfig } from '../../../config/types'
import type { AudiusWalletClient } from '../../AudiusWalletClient'

export type EthereumContractConfigInternal = {
  /** Ethereum RPC Endpoint */
  rpcEndpoint: string
  /** Viem client */
  client: PublicClient
  /** Contract addesses */
  addresses: SdkServicesConfig['ethereum']['addresses']
}

export type EthereumClientConfig = {
  audiusWalletClient: AudiusWalletClient
  ethPublicClient: PublicClient<Transport, typeof mainnet>
  ethWalletClient: WalletClient<Transport, typeof mainnet>
}

export const GasFeeSchema = z
  .union([
    z.object({
      // Legacy
      gasPrice: z.bigint().optional()
    }),
    z.object({
      // EIP-1559
      maxFeePerGas: z.bigint().optional(),
      maxPriorityFeePerGas: z.bigint().optional()
    })
  ])
  .and(
    z.object({
      gas: z.bigint().optional()
    })
  )
