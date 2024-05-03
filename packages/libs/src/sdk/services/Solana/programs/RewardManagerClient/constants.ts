import { PublicKey } from '@solana/web3.js'

import { Env } from '../../../../types/Env'

import type { RewardManagerClientConfigInternal } from './types'

export const defaultRewardManagerClentConfig: Record<
  Env,
  RewardManagerClientConfigInternal
> = {
  production: {
    programId: new PublicKey('DDZDcYdQFEMwcu2Mwo75yGFjJ1mUQyyXLWzhZLEVFcei'),
    rpcEndpoint: 'https://audius-fe.rpcpool.com',
    rewardManagerState: new PublicKey(
      '71hWFVYokLaN1PNYzTAWi13EfJ7Xt9VbSWUKsXUT8mxE'
    )
  },
  staging: {
    programId: new PublicKey('CDpzvz7DfgbF95jSSCHLX3ERkugyfgn9Fw8ypNZ1hfXp'),
    rpcEndpoint: 'https://audius-fe.rpcpool.com',
    rewardManagerState: new PublicKey(
      'GaiG9LDYHfZGqeNaoGRzFEnLiwUT7WiC6sA6FDJX9ZPq'
    )
  },
  development: {
    programId: new PublicKey('testLsJKtyABc9UXJF8JWFKf1YH4LmqCWBC42c6akPb'),
    rpcEndpoint: 'http://audius-protocol-discovery-provider-1',
    rewardManagerState: new PublicKey(
      'DJPzVothq58SmkpRb1ATn5ddN2Rpv1j2TcGvM3XsHf1c'
    )
  }
}
