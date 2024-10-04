import { ServiceTypeManager } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { ServiceTypeManagerConfig } from './types'

export class ServiceTypeManagerClient extends EthereumContract {
  discoveryNodeServiceType: `0x${string}`
  contentNodeServiceType: `0x${string}`
  contract: ServiceTypeManager

  constructor(config: ServiceTypeManagerConfig) {
    super(config)

    this.discoveryNodeServiceType = config.discoveryNodeServiceType
    this.contentNodeServiceType = config.contentNodeServiceType

    this.contract = new ServiceTypeManager(this.client, {
      address: config.addresses.serviceTypeManagerAddress
    })
  }

  getDiscoveryNodeVersion = () => {
    return this.contract.getCurrentVersion({
      serviceType: this.discoveryNodeServiceType
    })
  }

  getContentNodeVersion = () => {
    return this.contract.getCurrentVersion({
      serviceType: this.contentNodeServiceType
    })
  }
}
