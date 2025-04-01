import { metaMask, walletConnect } from '@wagmi/connectors'
import { type Chain } from 'viem'
import { createConfig, http } from 'wagmi'

import { env } from 'services/env'

export const audiusChain = {
  id: env.AUDIUS_NETWORK_CHAIN_ID,
  name: 'Audius',
  nativeCurrency: { name: '-', symbol: '-', decimals: 18 },
  rpcUrls: {
    default: { http: [`${env.API_URL}/core/erpc`] }
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
