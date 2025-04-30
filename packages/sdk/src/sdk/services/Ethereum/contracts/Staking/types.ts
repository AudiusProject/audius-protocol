import type { Hex } from 'viem'

import type { EthereumClientConfig } from '../types'

export type StakingConfig = StakingConfigInternal & EthereumClientConfig

export type StakingConfigInternal = { address: Hex }
