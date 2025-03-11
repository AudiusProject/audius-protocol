import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { DelegateManagerConfig } from './types'

export const getDefaultDelegateManagerConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): DelegateManagerConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
