import { mainnet, solana, type AppKitNetwork } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets'

import zIndex from 'utils/zIndex'

// 1. Get projectId from https://cloud.reown.com
const projectId = '24a90db08b835b7539f7f7f06d4d2374'

// 2. Create a metadata object - optional
const metadata = {
  name: 'Audius',
  description: 'Artists Deserve More',
  url: 'https://audius.co', // TODO: pull from env?
  icons: ['https://assets.reown.com/reown-profile-pic.png'] // TODO: Add our own icon?
}

// 3. Set the networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, solana]

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
})

const solanaAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
})

// 5. Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  networks,
  projectId,
  metadata,
  themeVariables: {
    '--w3m-z-index': zIndex.WEB3_WALLET_CONNECT_MODAL // above ConnectWalletModal
  },
  features: {
    send: false,
    swaps: false,
    onramp: false,
    socials: false,
    email: false
  }
})
