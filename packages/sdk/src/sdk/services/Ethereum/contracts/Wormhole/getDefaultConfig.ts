import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { WormholeConfig } from './types'

export const getDefaultWormholeConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): WormholeConfig => ({
  ...getDefaultEthereumClientConfig(config)
})
