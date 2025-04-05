import {
  mainnet,
  solana,
  type AppKitNetwork,
  type Chain
} from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

import { env } from 'services/env'
import zIndex from 'utils/zIndex'

// Audius ACDC chain (now ports to Core)
export const audiusChain = {
  id: env.AUDIUS_NETWORK_CHAIN_ID,
  name: 'Audius',
  nativeCurrency: { name: '-', symbol: '-', decimals: 18 },
  rpcUrls: {
    default: { http: [`${env.API_URL}/core/erpc`] }
  }
} as const satisfies Chain

// 1. Get projectId from https://cloud.reown.com
const projectId = '24a90db08b835b7539f7f7f06d4d2374'

// 2. Create a metadata object - optional
const metadata = {
  name: 'Audius',
  description: 'Artists Deserve More',
  url: env.AUDIUS_URL,
  icons: ['https://assets.reown.com/reown-profile-pic.png'] // TODO: Add our own icon?
}

// 3. Set the networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  solana,
  audiusChain
]

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
})

const solanaAdapter = new SolanaAdapter()

// 5. Create modal
export const appkitModal = createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  networks,
  projectId,
  metadata,
  themeVariables: {
    '--w3m-z-index': zIndex.REOWN_APPKIT_MODAL // above ConnectWalletModal
  },
  features: {
    send: false,
    swaps: false,
    onramp: false,
    socials: false,
    email: false
  }
})
