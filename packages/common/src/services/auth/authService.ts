import type { LocalStorage } from '../local-storage'

import { createHedgehog } from './hedgehog'
import type { IdentityService } from './identity'

export type AuthServiceConfig = {
  identityService: IdentityService
  localStorage: LocalStorage
}

export type SignInResponse = {
  walletAddress: string
}

export type GetWalletAddressesResult = {
  /** Wallet address of the current (acting-as) user. */
  accountWalletAddress: string
  /** Wallet address of the signed-in user */
  web3WalletAddress: string
}

export type AuthService = {
  hedgehogInstance: ReturnType<typeof createHedgehog>
  signIn: (
    email: string,
    password: string,
    visitorId?: string,
    otp?: string
  ) => Promise<SignInResponse>
  signOut: () => Promise<void>
  getWalletAddresses: () => Promise<GetWalletAddressesResult>
}

export const createAuthService = ({
  localStorage,
  identityService
}: AuthServiceConfig): AuthService => {
  const hedgehogInstance = createHedgehog({
    localStorage,
    useLocalStorage: true,
    identityService
  })

  const signIn = async (
    email: string,
    password: string,
    visitorId?: string,
    otp?: string
  ) => {
    // TODO: Move this into Hedgehog instance
    hedgehogInstance.ready = false
    // TODO: Support MM here
    const wallet = await hedgehogInstance.login({
      email,
      username: email,
      password,
      visitorId,
      otp
    })
    hedgehogInstance.ready = true

    const walletAddress = wallet.getAddressString()
    return { walletAddress }
  }

  const signOut = async () => {
    return hedgehogInstance.logout()
  }

  const getWalletAddresses = async () => {
    const walletOverride = await localStorage.getAudiusUserWalletOverride()
    await hedgehogInstance.waitUntilReady()
    const hedgehogAddress = hedgehogInstance.wallet?.getAddressString()
    return {
      accountWalletAddress: walletOverride || hedgehogAddress || '',
      web3WalletAddress: hedgehogAddress || ''
    }
  }

  return { hedgehogInstance, signIn, signOut, getWalletAddresses }
}
