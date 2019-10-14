// Authentication import is possible but not recommended, it should only be used by advanced users
const { Hedgehog, WalletManager } = require('@audius/hedgehog')

const { createKeyPBKDF2 } = require('./hedgehogOverride')

class HedgehogWrapper {
  // TODO - update this comment

  // This is some black magic going on here. The audiusServiceEndpoint is passed in along with the
  // requestToAudiusService function reference. When setFn and getFn call self.requestToAudiusService,
  // the context of `this` that's used is the HedgehogWrapper class, not the AudiusWeb3 class.
  // Therefore, we need to define this.audiusServiceEndpoint, to satisfy all the deps of the
  // requestToAudiusService and make it execute correctly

  constructor (identityService) {
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

    this.toQueryStr = (obj) => {
      return '?' +
        Object.keys(obj).map((key) => {
          return key + '=' + obj[key]
        }).join('&')
    }

    const hedgehog = new Hedgehog(this.getFn, this.setAuthFn, this.setUserFn)

    // this is also the place we have the PBKDF2 patch until we can deprecate it
    hedgehog.getAuthMigrationData = async (email, password, handle) => {
      let lookupKeyPBKDF2 = await createKeyPBKDF2(email, password)
      let entropy = WalletManager.getEntropyFromLocalStorage()

      if (!entropy) throw new Error('could not retrieve entropy from local storage')
      const createWalletPromise = await WalletManager.createWalletObj(password, entropy)
      const lookupKeyPromise = WalletManager.createAuthLookupKey(email, password)

      try {
        let result = await Promise.all([createWalletPromise, lookupKeyPromise])

        const { ivHex, cipherTextHex } = result[0]
        const lookupKey = result[1]

        return {
          oldValues: {
            lookupKey: lookupKeyPBKDF2
          },
          newValues: {
            iv: ivHex,
            cipherText: cipherTextHex,
            lookupKey: lookupKey
          },
          handle: handle
        }
      } catch (e) {
        throw e
      }
    }

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
    hedgehog.generateRecoveryLink = async (email) => {
      let entropy = await WalletManager.getEntropyFromLocalStorage()
      if (entropy === null) {
        throw new Error('generateRecoveryLink - missing entropy')
      }
      let btoa = window.btoa
      if (!btoa) {
        throw new Error('generateRecoveryLink - missing required btoa function')
      }
      let currentHost = window.location.origin
      let queryObj = {
        warning: 'RECOVERY_DO_NOT_SHARE'
      }
      queryObj.login = btoa(entropy)
      queryObj.email = email
      return currentHost + this.toQueryStr(queryObj)
    }

    return hedgehog
  }
}

module.exports = HedgehogWrapper
