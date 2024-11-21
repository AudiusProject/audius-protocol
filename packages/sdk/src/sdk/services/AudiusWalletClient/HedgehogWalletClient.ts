import { GetFn, Hedgehog, SetAuthFn, SetUserFn } from '@audius/hedgehog'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'
import type Wallet from 'ethereumjs-wallet'
import {
  createWalletClient,
  http,
  type Hex,
  type SignTypedDataParameters
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { productionConfig } from '../../config/production'
import { MissingOtpUserAuthError } from '../../utils/errors'
import fetch from '../../utils/fetch'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'

import { getDefaultUserAuthConfig } from './getDefaultConfig'
import type {
  UserAuthConfig,
  AudiusWalletClient,
  HedgehogWalletClientConfigInternal,
  TypedData
} from './types'

/**
 * A wallet client implementation that uses Hedgehog to generate the wallet.
 */
export class HedgehogWalletClient implements AudiusWalletClient {
  /**
   * Configuration passed in by the consumer (with defaults)
   */
  private config: HedgehogWalletClientConfigInternal

  /**
   * Hedgehog instance to handle auth
   */
  private readonly hedgehog: Hedgehog

  constructor(config?: UserAuthConfig) {
    this.config = mergeConfigWithDefaults(
      config,
      getDefaultUserAuthConfig(productionConfig)
    )
    const get: GetFn = async ({ lookupKey, email, visitorId, otp }) => {
      const params = new URLSearchParams({
        lookupKey,
        username: email as string
      })
      if (visitorId) {
        params.append('visitorId', visitorId as string)
      }
      if (otp) {
        params.append('otp', otp as string)
      }
      const response = await fetch(
        `${this.config.identityService}/authentication?${params}`
      )
      const json = await response.json()
      if (json.error === 'Missing otp') {
        throw new MissingOtpUserAuthError('Missing OTP coode')
      }
      return json
    }

    const setAuth: SetAuthFn = async (params) => {
      return fetch(`${this.config.identityService}/authentication`, {
        method: 'post',
        body: JSON.stringify(params)
      })
    }

    const setUser: SetUserFn = async (params) => {
      return fetch(`${this.config.identityService}/user`, {
        method: 'post',
        body: JSON.stringify(params)
      })
    }

    this.hedgehog = new Hedgehog(
      get,
      setAuth,
      setUser,
      config?.useLocalStorage ?? true
    )
    this.config.localStorage.then((ls) => (this.hedgehog.localStorage = ls))
  }

  sendTransaction = async () => {
    // TODO: Relay this to eth relay
    throw Error('not implemented')
  }

  signUp = async ({ email, password }: { email: string; password: string }) => {
    await this.hedgehog.waitUntilReady()
    const wallet: Wallet = await this.hedgehog.signUp({
      username: email,
      password
    })
    return wallet
  }

  signIn = async ({
    email,
    password,
    visitorId,
    otp
  }: {
    email: string
    password: string
    visitorId?: string
    otp?: string
  }) => {
    await this.hedgehog.waitUntilReady()
    const wallet = await this.hedgehog.login({
      username: email,
      password,
      email,
      visitorId,
      otp
    })
    return wallet
  }

  signOut = async () => {
    await this.hedgehog.logout()
  }

  isSignedIn = () => {
    return this.hedgehog.isLoggedIn()
  }

  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array> =
    async (publicKey) => {
      await this.hedgehog.waitUntilReady()
      const wallet = this.hedgehog.getWallet()
      if (!wallet) throw new Error('No wallet found')
      return secp.getSharedSecret(wallet.getPrivateKeyString(), publicKey, true)
    }

  sign: (data: string | Uint8Array) => Promise<[Uint8Array, number]> = async (
    data
  ) => {
    const wallet = this.hedgehog.getWallet()
    if (!wallet) throw new Error('No wallet')
    return secp.sign(keccak_256(data), wallet.getPrivateKeyString(), {
      recovered: true,
      der: false
    })
  }

  signMessage = async (message: string) => {
    await this.hedgehog.waitUntilReady()
    const wallet = this.hedgehog.getWallet()
    if (!wallet) throw new Error('No wallet')
    const account = privateKeyToAccount(wallet.getPrivateKeyString() as Hex)
    const walletClient = createWalletClient({ account, transport: http() })
    return walletClient.signMessage({ message })
  }

  signTypedData = async (data: TypedData) => {
    await this.hedgehog.waitUntilReady()
    const wallet = this.hedgehog.getWallet()
    if (!wallet) throw new Error('No wallet')
    const account = privateKeyToAccount(wallet.getPrivateKeyString() as Hex)
    const walletClient = createWalletClient({ account, transport: http() })
    return walletClient.signTypedData(data as SignTypedDataParameters)
  }

  getAddress: () => Promise<string> = async () => {
    await this.hedgehog.waitUntilReady()
    const wallet = this.hedgehog.getWallet()
    if (!wallet) throw new Error('No wallet')
    return wallet.getAddressString()
  }
}
