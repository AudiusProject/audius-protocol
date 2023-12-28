import { PublicKey } from '@solana/web3.js'
import type { RewardManagerClientConfigInternal } from './types'

export const defaultRewardManagerClentConfig: RewardManagerClientConfigInternal =
  {
    programId: new PublicKey('Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ'),
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    rewardManagerState: new PublicKey(
      '3V9opXNpHmPPymKeq7CYD8wWMH8wzFXmqEkNdzfsZhYq'
    )
  }
