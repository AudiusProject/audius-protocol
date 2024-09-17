import { ServiceProviderFactory } from '@audius/eth'
import { range } from 'lodash'

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

    this.contract = new ServiceProviderFactory()
  }

  getDiscoveryNodes = async () => {
    const count = await this.contract.getTotalServiceTypeProviders({
      serviceType: this.discoveryNodeServiceType
    })

    const list = await Promise.all(
      range(1, count + 1).map(
        async (i) =>
          await this.contract.getServiceEndpointInfo({
            serviceType: this.discoveryNodeServiceType,
            index: i
          })
      )
    )
    return list.filter(Boolean)
  }

  getContentNodes = async () => {
    const count = await this.contract.getTotalServiceTypeProviders({
      serviceType: this.contentNodeServiceType
    })

    const list = await Promise.all(
      range(1, count + 1).map(
        async (i) =>
          await this.contract.getServiceEndpointInfo({
            serviceType: this.contentNodeServiceType,
            index: i
          })
      )
    )
    return list.filter(Boolean)
  }
}
