import { metaMask, walletConnect } from '@wagmi/connectors'
import { type Chain } from 'viem'
import { createConfig, http } from 'wagmi'

export const audiusChain = {
  id: 1056801,
  name: 'Audius',
  nativeCurrency: { name: '-', symbol: '-', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://discoveryprovider.staging.audius.co/chain'] }
  }
} as const satisfies Chain

export const wagmiConfig = createConfig({
  chains: [audiusChain],
  transports: { [audiusChain.id]: http() },
  connectors: [
    metaMask(),
    walletConnect({ projectId: '24a90db08b835b7539f7f7f06d4d2374' })
  ]
})
