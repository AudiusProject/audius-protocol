import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { ClaimsManagerConfig } from './types'

export const getDefaultClaimsManagerConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): ClaimsManagerConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
