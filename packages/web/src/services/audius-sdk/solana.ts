import {
  ClaimableTokensClient,
  Configuration,
  RewardManagerClient,
  PaymentRouterClient,
  SolanaRelay,
  SolanaRelayWalletAdapter
} from '@audius/sdk'
import { PublicKey } from '@solana/web3.js'

import { env } from 'services/env'

const solanaRelay = new SolanaRelay(
  new Configuration({
    basePath: '/solana',
    headers: {
      'Content-Type': 'application/json'
    },
    middleware: [
      {
        pre: async (context) => {
          const endpoint = env.SOLANA_RELAY_ENDPOINT
          const url = `${endpoint}${context.url}`
          return { url, init: context.init }
        }
      }
    ]
  })
)

const solanaWalletAdapter = new SolanaRelayWalletAdapter({ solanaRelay })

export const claimableTokensService = new ClaimableTokensClient({
  programId: new PublicKey(env.CLAIMABLE_TOKEN_PROGRAM_ADDRESS),
  rpcEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
  mints: {
    wAUDIO: new PublicKey(env.WAUDIO_MINT_ADDRESS),
    USDC: new PublicKey(env.USDC_MINT_ADDRESS)
  },
  solanaWalletAdapter
})

export const rewardManagerService = new RewardManagerClient({
  programId: new PublicKey(env.REWARDS_MANAGER_PROGRAM_ID),
  rpcEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
  rewardManagerState: new PublicKey(env.REWARDS_MANAGER_PROGRAM_PDA),
  solanaWalletAdapter
})

export const paymentRouterService = new PaymentRouterClient({
  programId: new PublicKey(env.PAYMENT_ROUTER_PROGRAM_ID),
  rpcEndpoint: env.SOLANA_CLUSTER_ENDPOINT,
  mints: {
    wAUDIO: new PublicKey(env.WAUDIO_MINT_ADDRESS),
    USDC: new PublicKey(env.USDC_MINT_ADDRESS)
  },
  solanaWalletAdapter
})
