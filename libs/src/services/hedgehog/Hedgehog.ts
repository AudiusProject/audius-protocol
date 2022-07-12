import { Hedgehog as HedgehogBase, WalletManager } from '@audius/hedgehog'
import type { IdentityService } from '../identity'
import type { LocalStorage } from '../../utils/localStorage'

export type HedgehogConfig = {
  identityService: IdentityService
  useLocalStorage?: boolean
  localStorage?: LocalStorage
}
export class Hedgehog {
  identityService: IdentityService
  getFn: IdentityService['getFn']
  setAuthFn: IdentityService['setAuthFn']
  setUserFn: IdentityService['setUserFn']
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
    localStorage
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
      this.getFn,
      this.setAuthFn,
      this.setUserFn,
      useLocalStorage,
      localStorage
    )

    // we override the login function here because getFn needs both lookupKey and email
    // in identity service, but hedgehog only sends lookupKey
    hedgehog.login = async (email, password) => {
      const lookupKey = await WalletManager.createAuthLookupKey(email, password)

      // hedgehog property is called username so being consistent instead of calling it email
      const data = await this.getFn({ lookupKey: lookupKey, username: email })

      if (data?.iv && data.cipherText) {
        const { walletObj, entropy } =
          await WalletManager.decryptCipherTextAndRetrieveWallet(
            password,
            data.iv,
            data.cipherText
          )

        // set wallet property on the class
        hedgehog.wallet = walletObj

        // set entropy in localStorage
        await WalletManager.setEntropyInLocalStorage(entropy, localStorage)
        return walletObj
      } else {
        throw new Error('No account record for user')
      }
    }

    /**
     * Generate secure credentials to allow login
     */
    hedgehog.generateRecoveryInfo = async () => {
      const entropy = await WalletManager.getEntropyFromLocalStorage(
        localStorage
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
