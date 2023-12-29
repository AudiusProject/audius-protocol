import { getGovernanceAddressParams } from '@audius/erc'

import { EthereumContract } from "../EthereumContract";
import type { ServiceTypeManagerConfig } from "./types"

export class ServiceTypeManagerClient extends EthereumContract {
  constructor (config: ServiceTypeManagerConfig) {
    super(config)
  }

  async getGovernanceAddress() {
    this.client.readContract(getGovernanceAddressParams)
  }
}