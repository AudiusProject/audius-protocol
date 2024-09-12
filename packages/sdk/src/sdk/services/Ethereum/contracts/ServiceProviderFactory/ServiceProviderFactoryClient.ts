import { ServiceProviderFactory } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { ServiceTypeManagerConfig } from './types'

export class ServiceProviderFactoryClient extends EthereumContract {
  discoveryNodeServiceType: `0x${string}`
  contentNodeServiceType: `0x${string}`
  contract: typeof ServiceProviderFactory

  constructor(config: ServiceTypeManagerConfig) {
    super(config)

    this.discoveryNodeServiceType = config.discoveryNodeServiceType
    this.contentNodeServiceType = config.contentNodeServiceType

    this.contract = ServiceProviderFactory
  }
}
