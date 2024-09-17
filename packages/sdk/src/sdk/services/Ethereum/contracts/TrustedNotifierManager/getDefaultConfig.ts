import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { TrustedNotifierManagerConfig } from './types'

export const getDefaultTrustedNotifierManagerConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): TrustedNotifierManagerConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
