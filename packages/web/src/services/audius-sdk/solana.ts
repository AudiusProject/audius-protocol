import {
  ClaimableTokens,
  RewardManager,
  SolanaRelay,
  SolanaRelayWalletAdapter
} from '@audius/sdk'
import { PublicKey } from '@solana/web3.js'

const solanaRelay = new SolanaRelay({
  middleware: [
    {
      pre: async (context) => {
        const endpoint = process.env.VITE_SOLANA_RELAY_ENDPOINT
        const url = `${endpoint}${context.url}`
        return { url, init: context.init }
      }
    }
  ]
})

const solanaWalletAdapter = new SolanaRelayWalletAdapter(solanaRelay)

export const claimableTokensService = new ClaimableTokens(
  {
    rpcEndpoint: process.env.VITE_SOLANA_CLUSTER_ENDPOINT,
    mints: {
      wAUDIO: new PublicKey(process.env.VITE_WAUDIO_MINT_ADDRESS!),
      USDC: new PublicKey(process.env.VITE_USDC_MINT_ADDRESS!)
    },
    programId: new PublicKey(process.env.VITE_CLAIMABLE_TOKEN_PROGRAM_ADDRESS!)
  },
  solanaWalletAdapter
)

export const rewardManagerService = new RewardManager(
  {
    programId: new PublicKey(process.env.VITE_REWARDS_MANAGER_PROGRAM_ID!),
    rpcEndpoint: process.env.VITE_SOLANA_CLUSTER_ENDPOINT,
    rewardManagerState: new PublicKey(
      process.env.VITE_REWARDS_MANAGER_PROGRAM_PDA!
    )
  },
  solanaWalletAdapter
)
