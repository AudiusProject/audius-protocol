import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { GovernanceConfig } from './types'

export const getDefaultGovernanceConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): GovernanceConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
