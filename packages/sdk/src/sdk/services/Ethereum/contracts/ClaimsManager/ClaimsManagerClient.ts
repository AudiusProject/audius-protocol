import { ClaimsManager } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { ClaimsManagerConfig } from './types'

export class ClaimsManagerClient extends EthereumContract {
  contract: ClaimsManager

  constructor(config: ClaimsManagerConfig) {
    super(config)

    this.contract = new ClaimsManager(this.client)
  }
}
