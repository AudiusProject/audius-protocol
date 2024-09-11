import { ServiceTypeManager } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { ServiceTypeManagerConfig } from './types'

export class ServiceTypeManagerClient extends EthereumContract {
  discoveryNodeServiceType: `0x${string}`
  contentNodeServiceType: `0x${string}`

  constructor(config: ServiceTypeManagerConfig) {
    super(config)
    this.discoveryNodeServiceType = config.discoveryNodeServiceType
    this.contentNodeServiceType = config.contentNodeServiceType
  }

  getGovernanceAddress: typeof ServiceTypeManager.getGovernanceAddress = async (
    ...args
  ) => {
    return ServiceTypeManager.getGovernanceAddress(...args)
  }
}
