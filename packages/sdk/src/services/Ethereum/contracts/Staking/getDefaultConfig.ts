import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { StakingConfig } from './types'

export const getDefaultStakingConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): StakingConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
