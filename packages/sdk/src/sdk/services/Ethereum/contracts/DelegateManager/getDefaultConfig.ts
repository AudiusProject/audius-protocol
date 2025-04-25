import { SdkServicesConfig } from '../../../../config/types'

import type { DelegateManagerConfigInternal } from './types'

export const getDefaultDelegateManagerConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): DelegateManagerConfigInternal => ({
  address: config.ethereum.addresses.delegateManagerAddress
})
