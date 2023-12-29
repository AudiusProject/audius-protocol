import type { PublicClient } from 'viem'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import type { EthereumContractConfigInternal } from './types'

/**
 * Abstract class for initializing individual contract clients.
 */
export class EthereumContract {
    /** The viem client */
    protected readonly client: PublicClient
    constructor(
      config: EthereumContractConfigInternal,
    ) {
      this.client = createPublicClient({
        chain: mainnet,
        transport: http(config.rpcEndpoint)
      })
    }
}
