import { WormholeClient } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { WormholeConfig } from './types'

export class Wormhole extends EthereumContract {
  contract: typeof WormholeClient

  constructor(config: WormholeConfig) {
    super(config)

    this.contract = new WormholeClient()
  }
}
