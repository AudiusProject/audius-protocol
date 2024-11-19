import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { AudiusTokenConfigInternal } from './types'

export const getDefaultAudiusTokenConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): AudiusTokenConfigInternal => ({
  ...getDefaultEthereumClientConfig(config)
})
