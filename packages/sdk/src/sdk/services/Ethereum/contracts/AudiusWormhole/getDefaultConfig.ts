import { SdkServicesConfig } from '../../../../config/types'

import type { AudiusWormholeConfigInternal } from './types'

export const getDefaultWormholeConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): AudiusWormholeConfigInternal => ({
  address: config.ethereum.addresses.audiusWormholeAddress
})
