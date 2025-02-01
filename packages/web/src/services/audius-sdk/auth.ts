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
  const account = getAccount(wagmiConfig)
  const user = await localStorage.getAudiusAccountUser()

  // Check that the local storage user's wallet matches the connected external wallet
  if (
    ignoreCachedUserWallet ||
    (user?.wallet?.toLocaleLowerCase() &&
      user?.wallet?.toLowerCase() === account.address?.toLowerCase())
  ) {
    console.debug('[audiusSdk] Initializing SDK with external wallet...', {
      ignoreCachedUserWallet,
      userWallet: user?.wallet?.toLowerCase(),
      externalWallet: account?.address?.toLowerCase()
    })

    // Wait for the wallet to finish connecting/reconnecting
    if (
      wagmiConfig.state.status === 'reconnecting' ||
      wagmiConfig.state.status === 'connecting'
    ) {
      console.debug(
        `[audiusSdk] Waiting for external wallet to finish ${wagmiConfig.state.status}...`
      )
      let unsubscribe: undefined | (() => void)
      await new Promise<void>((resolve) => {
        unsubscribe = wagmiConfig.subscribe(
          (state) => state.status,
          () => {
            resolve()
          }
        )
      })
      console.debug(`[audiusSdk] External wallet ${wagmiConfig.state.status}.`)
      unsubscribe?.()
    }

    // If connected, initialize the viem WalletClient. Else fall back to Hedgehog.
    if (wagmiConfig.state.status === 'connected') {
      const client = await getWalletClient(wagmiConfig, {
        chainId: audiusChain.id
      })
      return client satisfies WalletClient as unknown as AudiusWalletClient
    }
  }
  console.debug('[audiusSdk] Initializing SDK with Hedgehog...')
  return createHedgehogWalletClient(authService.hedgehogInstance)
}

export const authService = createAuthService({
  localStorage,
  identityServiceEndpoint: env.IDENTITY_SERVICE
})

export const solanaWalletService = createHedgehogSolanaWalletService(
  authService.hedgehogInstance
)
