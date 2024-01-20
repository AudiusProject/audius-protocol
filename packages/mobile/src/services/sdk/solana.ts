import {
  ClaimableTokensClient,
  RewardManagerClient,
  SolanaRelay,
  SolanaRelayWalletAdapter
} from '@audius/sdk'
import { PublicKey } from '@solana/web3.js'

import { env } from '../env'

const solanaRelay = new SolanaRelay(new Configuration({
  middleware: [
    {
      pre: async (context) => {
        const endpoint = env.SOLANA_RELAY_ENDPOINT
        const url = `${endpoint}${context.url}`
        return { url, init: context.init }
      }
    }
  ]
}))

const solanaWalletAdapter = new SolanaRelayWalletAdapter({ solanaRelay })

export const claimableTokensService = new ClaimableTokensClient({
  rpcEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
  mints: {
    wAUDIO: new PublicKey(env.WAUDIO_MINT_ADDRESS!),
    USDC: new PublicKey(env.USDC_MINT_ADDRESS!)
  },
  programId: new PublicKey(env.CLAIMABLE_TOKEN_PROGRAM_ADDRESS!),
  solanaWalletAdapter
})

export const rewardManagerService = new RewardManagerClient({
  programId: new PublicKey(env.REWARDS_MANAGER_PROGRAM_ID!),
  rpcEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
  rewardManagerState: new PublicKey(env.REWARDS_MANAGER_PROGRAM_PDA!),
  solanaWalletAdapter
})
