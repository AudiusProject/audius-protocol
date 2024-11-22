import type { LocalStorage } from '../local-storage'

import { HedgehogConfig, createHedgehog } from './hedgehog'
import type { IdentityService } from './identity'

export type AuthServiceConfig = {
  identityService: IdentityService
  localStorage: LocalStorage
  createKey?: HedgehogConfig['createKey']
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
  identityService,
  createKey
}: AuthServiceConfig): AuthService => {
  const hedgehogInstance = createHedgehog({
    localStorage,
    useLocalStorage: true,
    identityService,
    createKey
  })

  const signIn = async (
    email: string,
    password: string,
    visitorId?: string,
    otp?: string
  ) => {
    const wallet = await hedgehogInstance.login({
      email,
      username: email,
      password,
      visitorId,
      otp
    })

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
    console.log('asdf wallet', hedgehogAddress, walletOverride, hedgehogAddress)
    return {
      accountWalletAddress: walletOverride || hedgehogAddress || '',
      web3WalletAddress: hedgehogAddress || ''
    }
  }

  return { hedgehogInstance, signIn, signOut, getWalletAddresses }
}
