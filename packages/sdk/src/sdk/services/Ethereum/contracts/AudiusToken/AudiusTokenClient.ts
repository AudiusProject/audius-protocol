import { AudiusToken } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { AudiusTokenConfig } from './types'

export class AudiusTokenClient extends EthereumContract {
  contract: AudiusToken

  constructor(config: AudiusTokenConfig) {
    super(config)

    this.contract = new AudiusToken(config.client)
  }
}
