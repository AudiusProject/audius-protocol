import { Solana } from '@audius/sdk'
import { PublicKey } from '@solana/web3.js'

import { env } from 'services/env'

export const solanaService = new Solana({
  middleware: [
    {
      pre: async (context) => {
        const endpoint = env.SOLANA_RELAY_ENDPOINT
        const url = `${endpoint}${context.url}`
        return { url, init: context.init }
      }
    }
  ],
  rpcEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
  mints: {
    wAUDIO: new PublicKey(env.WAUDIO_MINT_ADDRESS!),
    USDC: new PublicKey(env.USDC_MINT_ADDRESS!)
  },
  programIds: {
    claimableTokens: new PublicKey(env.CLAIMABLE_TOKEN_PROGRAM_ADDRESS!),
    rewardManager: new PublicKey(env.REWARDS_MANAGER_PROGRAM_ID!),
    paymentRouter: new PublicKey(env.PAYMENT_ROUTER_PROGRAM_ID!)
  }
})
