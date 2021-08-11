// Authentication import is possible but not recommended, it should only be used by advanced users
const { Hedgehog, WalletManager } = require('@audius/hedgehog')

class HedgehogWrapper {
  // TODO - update this comment

  // This is some black magic going on here. The audiusServiceEndpoint is passed in along with the
  // requestToAudiusService function reference. When setFn and getFn call self.requestToAudiusService,
  // the context of `this` that's used is the HedgehogWrapper class, not the AudiusWeb3 class.
  // Therefore, we need to define this.audiusServiceEndpoint, to satisfy all the deps of the
  // requestToAudiusService and make it execute correctly

  constructor (identityService, useLocalStorage = true) {
    this.identityService = identityService

    this.getFn = async (obj) => {
      return this.identityService.getFn(obj)
    }

    this.setAuthFn = async (obj) => {
      return this.identityService.setAuthFn(obj)
    }

    this.setUserFn = async (obj) => {
      return this.identityService.setUserFn(obj)
    }

    const hedgehog = new Hedgehog(
      this.getFn,
      this.setAuthFn,
      this.setUserFn,
      useLocalStorage
    )

    // we override the login function here because getFn needs both lookupKey and email
    // in identity service, but hedgehog only sends lookupKey
    hedgehog.login = async (email, password) => {
      let lookupKey = await WalletManager.createAuthLookupKey(email, password)

      // hedgehog property is called username so being consistent instead of calling it email
      let data = await this.getFn({ lookupKey: lookupKey, username: email })

      if (data && data.iv && data.cipherText) {
        const { walletObj, entropy } = await WalletManager.decryptCipherTextAndRetrieveWallet(
          password,
          data.iv,
          data.cipherText
        )

        // set wallet property on the class
        hedgehog.wallet = walletObj

        // set entropy in localStorage
        WalletManager.setEntropyInLocalStorage(entropy)
        return walletObj
      } else {
        throw new Error('No account record for user')
      }
    }

    /**
     * Generate secure credentials to allow login
     * @param {String} username username
     */
    hedgehog.generateRecoveryInfo = async () => {
      let entropy = await WalletManager.getEntropyFromLocalStorage()
      if (entropy === null) {
        throw new Error('generateRecoveryLink - missing entropy')
      }
      let btoa = window.btoa
      if (!btoa) {
        throw new Error('generateRecoveryLink - missing required btoa function')
      }
      let currentHost = window.location.origin
      let recoveryInfo = {}
      recoveryInfo.login = btoa(entropy)
      recoveryInfo.host = currentHost
      return recoveryInfo
    }

    return hedgehog
  }
}

module.exports = HedgehogWrapper
