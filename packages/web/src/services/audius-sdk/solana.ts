import { Solana } from '@audius/sdk'
import { PublicKey } from '@solana/web3.js'

export const solanaService = new Solana({
  middleware: [
    {
      pre: async (context) => {
        const endpoint = process.env.VITE_SOLANA_RELAY_ENDPOINT
        const url = `${endpoint}${context.url}`
        return { url, init: context.init }
      }
    }
  ],
  rpcEndpoint: process.env.VITE_SOLANA_CLUSTER_ENDPOINT,
  mints: {
    wAUDIO: new PublicKey(process.env.VITE_WAUDIO_MINT_ADDRESS!),
    USDC: new PublicKey(process.env.VITE_USDC_MINT_ADDRESS!)
  },
  programIds: {
    claimableTokens: new PublicKey(
      process.env.VITE_CLAIMABLE_TOKEN_PROGRAM_ADDRESS!
    ),
    rewardManager: new PublicKey(process.env.VITE_REWARDS_MANAGER_PROGRAM_ID!),
    paymentRouter: new PublicKey(process.env.VITE_PAYMENT_ROUTER_PROGRAM_ID!)
  }
})
