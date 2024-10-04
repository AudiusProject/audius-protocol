import { Staking } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { StakingConfig } from './types'

export class StakingClient extends EthereumContract {
  contract: Staking

  constructor(config: StakingConfig) {
    super(config)

    this.contract = new Staking(this.client)
  }
}
