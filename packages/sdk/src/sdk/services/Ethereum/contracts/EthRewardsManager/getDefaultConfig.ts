import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { EthRewardsManagerConfig } from './types'

export const getDefaultEthRewardsManagerConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): EthRewardsManagerConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
