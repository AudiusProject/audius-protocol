import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { RegistryConfig } from './types'

export const getDefaultRegistryConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): RegistryConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
