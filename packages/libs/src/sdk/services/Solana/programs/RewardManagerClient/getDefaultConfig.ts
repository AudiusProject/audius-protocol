import { PublicKey } from '@solana/web3.js'

import { SdkServicesConfig } from '../../../../config'

import type { RewardManagerClientConfigInternal } from './types'

export const getDefaultRewardManagerClentConfig = (
  config: SdkServicesConfig
): RewardManagerClientConfigInternal => ({
  programId: new PublicKey(config.solana.rewardManagerProgramAddress),
  rpcEndpoint: config.solana.rpcEndpoint,
  rewardManagerState: new PublicKey(config.solana.rewardManagerStateAddress)
})
