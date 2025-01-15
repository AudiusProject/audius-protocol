import {
  createAuthService,
  createHedgehogSolanaWalletService
} from '@audius/common/services'
import {
  audiusWalletActions,
  createHedgehogWalletClient,
  type AudiusAccount,
  type AudiusWalletClient
} from '@audius/sdk'
import { metaMask } from '@wagmi/connectors'
import { connect, createConfig, getWalletClient } from '@wagmi/core'
import { createClient, custom, type Chain, type CustomTransport } from 'viem'

import { env } from '../env'
import { localStorage } from '../local-storage'

const audiusChain = {
  id: 1056801,
  name: 'Audius',
  nativeCurrency: { name: '-', symbol: '-', decimals: 0 },
  rpcUrls: {
    default: { http: ['https://discoveryprovider.staging.audius.co/chain'] }
  }
} as const satisfies Chain

export const getAudiusWalletClient = async (): Promise<AudiusWalletClient> => {
  const useMetaMask = await localStorage.getItem('useMetaMask')
  if (useMetaMask) {
    const config = createConfig({
      connectors: [metaMask()],
      chains: [audiusChain],
      client({ chain }) {
        return createClient<CustomTransport, any, AudiusAccount>({
          chain,
          transport: custom(window.ethereum)
        }).extend(audiusWalletActions)
      }
    })
    await connect(config, { chainId: audiusChain.id, connector: metaMask() })
    const client = await getWalletClient(config)
    return client as unknown as AudiusWalletClient
  }
  return createHedgehogWalletClient(authService.hedgehogInstance)
}

export const authService = createAuthService({
  localStorage,
  identityServiceEndpoint: env.IDENTITY_SERVICE
})

export const solanaWalletService = createHedgehogSolanaWalletService(
  authService.hedgehogInstance
)
