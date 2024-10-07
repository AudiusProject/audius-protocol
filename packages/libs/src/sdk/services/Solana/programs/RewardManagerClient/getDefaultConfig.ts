import { PublicKey } from '@solana/web3.js'

import type { SdkServicesConfig } from '../../../../config/types'
import { Logger } from '../../../Logger'

import type { RewardManagerClientConfigInternal } from './types'

export const getDefaultRewardManagerClentConfig = (
  config: SdkServicesConfig
): RewardManagerClientConfigInternal => ({
  programId: new PublicKey(config.solana.rewardManagerProgramAddress),
  rewardManagerState: new PublicKey(config.solana.rewardManagerStateAddress),
  rewardManagerLookupTable: new PublicKey(
    config.solana.rewardManagerLookupTableAddress
  ),
  logger: new Logger()
})
