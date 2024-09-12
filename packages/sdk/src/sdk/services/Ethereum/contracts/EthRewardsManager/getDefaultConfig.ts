import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { EthRewardsManagerConfig } from './types'

export const getDefaultEthRewardsManagerConfig = (
  config: SdkServicesConfig
): EthRewardsManagerConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
