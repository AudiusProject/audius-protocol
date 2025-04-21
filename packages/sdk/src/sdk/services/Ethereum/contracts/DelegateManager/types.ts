import type { Hex } from 'viem'

import type { EthereumClientConfig } from '../types'

export type DelegateManagerConfig = DelegateManagerConfigInternal &
  EthereumClientConfig

export type DelegateManagerConfigInternal = { address: Hex }
