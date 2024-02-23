import { GetFn, Hedgehog, SetAuthFn, SetUserFn } from '@audius/hedgehog'
import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'
import fetch from 'cross-fetch'
import { EIP712TypedData, MessageData, signTypedData } from 'eth-sig-util'

import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'

import { defaultHedgehogAuthConfig } from './constants'
import type { AuthConfig, AuthService } from './types'

export class HedgehogAuth implements AuthService {
  /**
   * Configuration passed in by the consumer (with defaults)
   */
  private config: AuthConfig

  /**
   * Hedgehog instance to handle auth
   */
  private readonly hedgehog: Hedgehog

  constructor(config?: AuthConfig) {
    this.config = mergeConfigWithDefaults(config, defaultHedgehogAuthConfig)

    const get: GetFn = async ({ lookupKey, email, otp }) => {
      const params = new URLSearchParams({
        lookupKey,
        username: email as string
      })
      if (otp) {
        params.append('otp', otp as string)
      }
      const response = await fetch(
        `${this.config.identityService}/authentication?${params}`
      )
      return response.json()
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
      /* useLocalStorage */ true
    )
    this.config.localStorage.then((ls) => (this.hedgehog.localStorage = ls))
  }

  signUp = async ({ email, password }: { email: string; password: string }) => {
    await this.hedgehog.waitUntilReady()
    const wallet = await this.hedgehog.signUp({ username: email, password })
    return wallet
  }

  signIn = async ({
    email,
    password,
    otp
  }: {
    email: string
    password: string
    otp?: string
  }) => {
    await this.hedgehog.waitUntilReady()
    const wallet = await this.hedgehog.login({
      username: email,
      password,
      email,
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
      return secp.getSharedSecret(
        // @ts-ignore private key is private
        this.hedgehog.getWallet()?.privateKey,
        publicKey,
        true
      )
    }

  sign: (data: string | Uint8Array) => Promise<[Uint8Array, number]> = async (
    data
  ) => {
    const wallet = this.hedgehog.getWallet()
    if (!wallet) throw new Error('No wallet')
    return secp.sign(
      keccak_256(data),
      // @ts-ignore private key is private
      wallet.privateKey,
      {
        recovered: true,
        der: false
      }
    )
  }

  hashAndSign: (data: string) => Promise<string> = () => {
    throw new Error('hashAndSign not initialized')
  }

  signTransaction: (
    data: MessageData<EIP712TypedData>['data']
  ) => Promise<string> = async (data) => {
    await this.hedgehog.waitUntilReady()
    const wallet = this.hedgehog.getWallet()
    if (!wallet) throw new Error('No wallet')
    return signTypedData(
      Buffer.from(
        // @ts-ignore private key is private
        wallet.privateKey,
        'hex'
      ),
      { data }
    )
  }

  getAddress: () => Promise<string> = async () => {
    await this.hedgehog.waitUntilReady()
    const wallet = this.hedgehog.getWallet()
    if (!wallet) throw new Error('No wallet')
    return wallet.getAddressString()
  }
}
