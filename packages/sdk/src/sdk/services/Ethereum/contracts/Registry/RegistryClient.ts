import { Registry } from '@audius/eth'

import { EthereumContract } from '../EthereumContract'

import type { RegistryConfig } from './types'

export class RegistryClient extends EthereumContract {
  contract: Registry

  constructor(config: RegistryConfig) {
    super(config)

    this.contract = new Registry(this.client)
  }
}
