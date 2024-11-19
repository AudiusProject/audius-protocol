import { SdkServicesConfig } from '../../../../config/types'
import { getDefaultEthereumClientConfig } from '../getDefaultConfig'

import type { WormholeConfigInternal } from './types'

export const getDefaultWormholeConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): WormholeConfigInternal => ({
  ...getDefaultEthereumClientConfig(config)
})
