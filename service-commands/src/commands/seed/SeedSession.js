const AudiusLibs = require('@audius/libs')
const UserCache = require('./UserCache')
const LocalStorageWrapper = require('./LocalStorageWrapper')

const {
  RandomUtils,
  SeedUtils,
  Constants
} = require('../../utils')

const {
  SEED_CACHE_PATH
} = Constants

const {
  getLibsConfig
} = SeedUtils

const {
  getRandomEmail,
  getRandomPassword,
  getRandomUserMetadata,
} = RandomUtils

class SeedSession {
  constructor() {
    this.cache = new UserCache()
    this.localstorage = new LocalStorageWrapper()
  }

  init = async (libsConfigOverride = {}) => {
      const libsConfig = getLibsConfig(libsConfigOverride)
      this.libs = new AudiusLibs(libsConfig)
      await this.libs.init()
  }

  clearSession = async () => {
      this.localstorage.clear()
      this.libs = undefined
      this.cache.clear()
  }

  setUser = async ({ alias = '', userId = null }) => {
      const userDetails = this.cache.findUser({ alias, userId })
      const { hedgehogEntropyKey, userAlias } = userDetails
      if (!userDetails.hedgehogEntropyKey) {
        console.error(`No user with alias ${alias} or id ${userId} found in local seed cache.`)
      } else {
        this.localstorage.setUserEntropy(hedgehogEntropyKey)
        this.cache.setActiveUser(userAlias)
      }
      const libsConfigOverride = {
        identityServiceConfig: {
          useHedgehogLocalStorage: true
        }
      }
      await this.init(libsConfigOverride)
      if (!this.libs.userStateManager.getCurrentUserId() === userDetails.userId) {
        throw new Error(`Error calling SeedSession.setUser with alias ${alias} / userId ${userId} -- please check your seed cache at ${SEED_CACHE_PATH} to ensure that user exists.`)
      }
  }

  createUser = async (alias, options) => {
    let { email, password, metadata } = options
    if (!email) {
      email = getRandomEmail()
    }
    if (!password) {
      password = getRandomPassword()
    }
    const randomMetadata = getRandomUserMetadata(email, password)
    if (!metadata) {
      metadata = randomMetadata
    } else {
      metadata = Object.assign(randomMetadata, metadata)
    }
    let signUpResponse
    const profilePictureFile = null
    const coverPhotoFile = null
    const hasWallet = false
    const host = (typeof window !== 'undefined' && window.location.origin) || null
    const createWAudioUserBank = false
    try {
      signUpResponse = await this.libs.Account.signUp(email, password, metadata, profilePictureFile, coverPhotoFile, hasWallet, host, createWAudioUserBank)
    } catch (error) {
      console.log(error, signUpResponse)
    }
    if (signUpResponse.error) {
      throw new Error(signUpResponse.error)
    } else {
      const hedgehogEntropyKey = this.localstorage.getUserEntropy()
      const userId = signUpResponse.userId
      if (!alias) {
        alias = hedgehogEntropyKey
      }
      this.cache.addUser({ alias, hedgehogEntropyKey, userId })
      this.cache.addLoginDetails({ entropy: hedgehogEntropyKey, email, password })
      this.cache.setActiveUser(alias)
      console.log(`Successfully seeded user with id: ${userId} and alias: ${alias}`)
      return
    }
  }
  // TODO API methods that call through to CLI things (wrapper layer)?
}

module.exports = SeedSession
