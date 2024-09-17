import { DelegateManager } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { DelegateManagerConfig } from './types'

export class DelegateManagerClient extends EthereumContract {
  contract: typeof DelegateManager

  constructor(config: DelegateManagerConfig) {
    super(config)

    this.contract = new DelegateManager()
  }
}
