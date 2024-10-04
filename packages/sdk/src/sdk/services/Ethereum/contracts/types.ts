import { PublicClient } from 'viem'

import { SdkServicesConfig } from '../../../config/types'

export type EthereumContractConfigInternal = {
  /** Ethereum RPC Endpoint */
  rpcEndpoint: string
  /** Viem client */
  client: PublicClient
  /** Contract addesses */
  addresses: SdkServicesConfig['ethereum']['addresses']
}
