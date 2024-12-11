import { EthWallet } from '@audius/hedgehog'
import type { ChangeCredentialsArgs } from '@audius/hedgehog/dist/types'

import type { LocalStorage } from '../local-storage'

import { HedgehogConfig, createHedgehog } from './hedgehog'

export type AuthServiceConfig = {
  identityServiceEndpoint: string
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
  resetPassword: ({
    username,
    password
  }: {
    username: string
    password: string
  }) => Promise<void>
  getWalletAddresses: () => Promise<GetWalletAddressesResult>
  getWallet: () => EthWallet | null
  changeCredentials: (args: ChangeCredentialsArgs) => Promise<void>
}

export const createAuthService = ({
  localStorage,
  identityServiceEndpoint,
  createKey
}: AuthServiceConfig): AuthService => {
  const hedgehogInstance = createHedgehog({
    localStorage,
    useLocalStorage: true,
    identityServiceEndpoint,
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

  const resetPassword = async ({
    username,
    password
  }: {
    username: string
    password: string
  }) => {
    return hedgehogInstance.resetPassword({ username, password })
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

  const changeCredentials = async (args: ChangeCredentialsArgs) => {
    return await hedgehogInstance.changeCredentials(args)
  }

  const getWallet = () => {
    return hedgehogInstance.wallet
  }

  return {
    hedgehogInstance,
    signIn,
    signOut,
    getWallet,
    getWalletAddresses,
    changeCredentials,
    resetPassword
  }
}
