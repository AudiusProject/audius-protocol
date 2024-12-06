import { SdkServicesConfig } from '../../../../config/types'

import type { AudiusTokenConfigInternal } from './types'

export const getDefaultAudiusTokenConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): AudiusTokenConfigInternal => ({
  address: config.ethereum.addresses.audiusTokenAddress
})
