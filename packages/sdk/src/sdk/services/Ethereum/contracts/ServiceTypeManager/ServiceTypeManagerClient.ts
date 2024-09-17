import { ServiceTypeManager } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { ServiceTypeManagerConfig } from './types'

export class ServiceTypeManagerClient extends EthereumContract {
  discoveryNodeServiceType: `0x${string}`
  contentNodeServiceType: `0x${string}`
  contract: typeof ServiceTypeManager

  constructor(config: ServiceTypeManagerConfig) {
    super(config)

    this.discoveryNodeServiceType = config.discoveryNodeServiceType
    this.contentNodeServiceType = config.contentNodeServiceType

    this.contract = new ServiceTypeManager()
  }

  getDiscoveryNodeVersion = () => {
    return this.contract.getCurrentVersion(this.discoveryNodeServiceType)
  }

  getContentNodeVersion = () => {
    return this.contract.getCurrentVersion(this.contentNodeServiceType)
  }
}
