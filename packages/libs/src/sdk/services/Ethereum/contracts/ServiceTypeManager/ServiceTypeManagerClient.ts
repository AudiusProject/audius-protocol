import { ServiceTypeManager } from '@audius/erc'

import { EthereumContract } from "../EthereumContract";
import type { ServiceTypeManagerConfig } from "./types"

export class ServiceTypeManagerClient extends EthereumContract {
  discoveryNodeServiceType: `0x${string}`
  contentNodeServiceType: `0x${string}`

  constructor (config: ServiceTypeManagerConfig) {
    super(config)
    this.discoveryNodeServiceType = '0x646973636f766572792d6e6f6465'
    this.contentNodeServiceType = '0x636f6e74656e742d6e6f6465'
  }

  getGovernanceAddress: typeof ServiceTypeManager.getGovernanceAddress = async (...args) => {
    return ServiceTypeManager.getGovernanceAddress(...args)
  }
}