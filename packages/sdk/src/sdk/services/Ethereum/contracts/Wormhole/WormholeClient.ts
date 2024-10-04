import { Wormhole } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { WormholeConfig } from './types'

export class WormholeClient extends EthereumContract {
  contract: Wormhole

  constructor(config: WormholeConfig) {
    super(config)

    this.contract = new Wormhole(this.client)
  }
}
