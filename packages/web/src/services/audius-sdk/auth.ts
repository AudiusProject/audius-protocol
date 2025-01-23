import {
  createAuthService,
  createHedgehogSolanaWalletService
} from '@audius/common/services'
import {
  createHedgehogWalletClient,
  type AudiusWalletClient
} from '@audius/sdk'
import { getAccount, getWalletClient } from '@wagmi/core'
import { type WalletClient } from 'viem'

import { env } from '../env'
import { localStorage } from '../local-storage'

import { audiusChain, wagmiConfig } from './wagmi'

export const getAudiusWalletClient = async (opts?: {
  ignoreCachedUserWallet?: boolean
}): Promise<AudiusWalletClient> => {
  const { ignoreCachedUserWallet = false } = opts ?? {}
  if (
    wagmiConfig.state.status === 'reconnecting' ||
    wagmiConfig.state.status === 'connecting'
  ) {
    console.info('[audiusSdk] Waiting for external wallet to connect...')
    let unsubscribe: undefined | (() => void)
    await new Promise<void>((resolve) => {
      unsubscribe = wagmiConfig.subscribe(
        (state) => state.status,
        () => {
          resolve()
        }
      )
    })
    unsubscribe?.()
  }

  if (
    wagmiConfig.state.status === 'connected' &&
    // Only support metaMask for now
    wagmiConfig.state.connections.get(wagmiConfig.state.current!)?.connector
      .type === 'metaMask'
  ) {
    const account = getAccount(wagmiConfig)
    const user = await localStorage.getAudiusAccountUser()
    if (
      !ignoreCachedUserWallet &&
      user?.wallet?.toLowerCase() !== account.address?.toLowerCase()
    ) {
      console.warn(
        '[audiusSdk] External wallet connected but cached user does not match connected external wallet. Falling back to Hedgehog...'
      )
    } else {
      console.info('[audiusSdk] Initializing SDK with external wallet...')
      const client = await getWalletClient(wagmiConfig, {
        chainId: audiusChain.id
      })
      return client satisfies WalletClient as unknown as AudiusWalletClient
    }
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
