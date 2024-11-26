import type { Hex } from 'viem'

import type { EthereumClientConfig } from '../types'

export type AudiusTokenConfig = AudiusTokenConfigInternal & EthereumClientConfig

export type AudiusTokenConfigInternal = {
  address: Hex
}
