import { EthRewardsManager } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { EthRewardsManagerConfig } from './types'

export class EthRewardsManagerClient extends EthereumContract {
  contract: typeof EthRewardsManager

  constructor(config: EthRewardsManagerConfig) {
    super(config)

    this.contract = new EthRewardsManager()
  }
}
