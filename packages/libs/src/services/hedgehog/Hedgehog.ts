import {
  Hedgehog as HedgehogBase,
  WalletManager,
  getPlatformCreateKey
} from '@audius/hedgehog'
import type { SetAuthFn, SetUserFn, GetFn, CreateKey } from '@audius/hedgehog'

import type { LocalStorage } from '../../utils/localStorage'
import type { IdentityService } from '../identity'

export type HedgehogConfig = {
  identityService: IdentityService
  useLocalStorage?: boolean
  localStorage?: LocalStorage
  createKey?: CreateKey
}
export class Hedgehog {
  identityService: IdentityService
  getFn: IdentityService['getFn']
  setAuthFn: SetAuthFn
  setUserFn: SetUserFn
  instance: HedgehogBase

  // TODO - update this comment

  // This is some black magic going on here. The audiusServiceEndpoint is passed in along with the
  // requestToAudiusService function reference. When setFn and getFn call self.requestToAudiusService,
  // the context of `this` that's used is the HedgehogWrapper class, not the AudiusWeb3 class.
  // Therefore, we need to define this.audiusServiceEndpoint, to satisfy all the deps of the
  // requestToAudiusService and make it execute correctly

  constructor({
    identityService,
    useLocalStorage = true,
    localStorage,
    createKey = getPlatformCreateKey()
  }: HedgehogConfig) {
    this.identityService = identityService

    this.getFn = async (obj) => {
      return await this.identityService.getFn(obj)
    }

    this.setAuthFn = async (obj) => {
      return await this.identityService.setAuthFn(obj)
    }

    this.setUserFn = async (obj) => {
      return await this.identityService.setUserFn(obj)
    }

    const hedgehog = new HedgehogBase(
      this.getFn as GetFn,
      this.setAuthFn,
      this.setUserFn,
      useLocalStorage,
      localStorage,
      createKey
    )

    // we override the login function here because getFn needs lookupKey, email, and otp
    // for identity service.
    hedgehog.login = async (email: string, password: string, otp?: string) => {
      const lookupKey = await WalletManager.createAuthLookupKey(
        email,
        password,
        createKey
      )

      // hedgehog property is called username so being consistent instead of calling it email
      const data = await this.getFn({ lookupKey, username: email, otp })

      if (data?.iv && data.cipherText) {
        const { walletObj, entropy } =
          await WalletManager.decryptCipherTextAndRetrieveWallet(
            password,
            data.iv,
            data.cipherText,
            createKey
          )

        // set wallet property on the class
        hedgehog.wallet = walletObj

        // set entropy in localStorage
        await WalletManager.setEntropyInLocalStorage(
          entropy,
          hedgehog.localStorage
        )
        return walletObj
      } else {
        throw new Error('No account record for user')
      }
    }

    hedgehog.confirmCredentials = async (
      email: string,
      password: string,
      otp?: string,
      checkAuthOnly = false
    ) => {
      const existingEntropy = await WalletManager.getEntropyFromLocalStorage(
        hedgehog.localStorage
      )
      if (!existingEntropy) return false // not logged in yet

      const lookupKey = await WalletManager.createAuthLookupKey(
        email,
        password,
        hedgehog.createKey
      )

      if (checkAuthOnly) {
        try {
          // Just check if combo exists
          await this.identityService.checkAuth({ lookupKey })
          return true
        } catch (e) {
          return false
        }
      }
      const data = await this.getFn({ lookupKey, username: email, otp })

      if (data && data.iv && data.cipherText) {
        const { walletObj, entropy } =
          await WalletManager.decryptCipherTextAndRetrieveWallet(
            password,
            data.iv,
            data.cipherText,
            hedgehog.createKey
          )

        // test against current entropy in localStorage and current wallet
        return (
          entropy === existingEntropy &&
          hedgehog.wallet !== null &&
          hedgehog.wallet.getAddressString() === walletObj.getAddressString()
        )
      }
      return false
    }

    /**
     * Generate secure credentials to allow login
     */
    // @ts-expect-error -- adding our own custom method to hedgehog
    hedgehog.generateRecoveryInfo = async () => {
      const entropy = await WalletManager.getEntropyFromLocalStorage(
        hedgehog.localStorage
      )
      if (entropy === null) {
        throw new Error('generateRecoveryLink - missing entropy')
      }
      let btoa // binary to base64 ASCII conversion
      let currentHost
      if (typeof window !== 'undefined' && window && window.btoa) {
        btoa = window.btoa
        currentHost = window.location.origin
      } else {
        btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
        currentHost = 'localhost'
      }
      const recoveryInfo = { login: btoa(entropy), host: currentHost }
      return recoveryInfo
    }

    this.instance = hedgehog
  }
}
