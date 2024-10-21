import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { AudiusTokenConfig } from './types'

export const getDefaultAudiusTokenConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): AudiusTokenConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
