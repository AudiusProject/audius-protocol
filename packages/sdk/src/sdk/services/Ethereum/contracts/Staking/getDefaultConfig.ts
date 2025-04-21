import { SdkServicesConfig } from '../../../../config/types'

import type { StakingConfigInternal } from './types'

export const getDefaultStakingConfig = (config: {
  ethereum: SdkServicesConfig['ethereum']
}): StakingConfigInternal => ({
  address: config.ethereum.addresses.stakingAddress
})
