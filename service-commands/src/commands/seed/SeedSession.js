const AudiusLibs = require('@audius/libs')
const UserCache = require('./UserCache')
const LocalStorageWrapper = require('./LocalStorageWrapper')

const { RandomUtils, SeedUtils, Constants } = require('../../utils')

const { SEED_CACHE_PATH } = Constants

const { getLibsConfig } = SeedUtils

const { getRandomEmail, getRandomPassword, getRandomUserMetadata } = RandomUtils

/*
  This class provides a JS interface to a stateful local session for seeding data
  programmatically against a running stack of Audius services for test setup etc.

  Each instance leverages the seed cache json object stored at ~/.audius/SEED_CACHE_PATH
  as well as node-localstorage to maintain the state of users performing actions to seed.
*/
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
      console.error(
        `No user with alias ${alias} or id ${userId} found in local seed cache.`
      )
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
      throw new Error(
        `Error calling SeedSession.setUser with alias ${alias} / userId ${userId} -- please check your seed cache at ${SEED_CACHE_PATH} to ensure that user exists.`
      )
    } else {
      console.log(`Set user alias ${alias} or userId ${userId} successfully.`)
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
    const host =
      (typeof window !== 'undefined' && window.location.origin) || null
    try {
      signUpResponse = await this.libs.Account.signUp(
        email,
        password,
        metadata,
        profilePictureFile,
        coverPhotoFile,
        hasWallet,
        host,
      )
    } catch (error) {
      console.error(error, signUpResponse)
    }
    if (signUpResponse.error) {
      console.error(
        `Got signup error: ${signUpResponse.error} at phase: ${signUpResponse.phase}`
      )
      throw new Error(signUpResponse.error)
    } else {
      const hedgehogEntropyKey = this.localstorage.getUserEntropy()
      const userId = signUpResponse.userId
      const userAlias = !!alias ? alias : hedgehogEntropyKey
      this.cache.addUser({ alias: userAlias, hedgehogEntropyKey, userId })
      this.cache.addLoginDetails({
        entropy: hedgehogEntropyKey,
        email,
        password
      })
      this.cache.addWalletDetails({
        entropy: hedgehogEntropyKey,
        privKey: this.libs.hedgehog.wallet._privKey.toString('hex')
      })
      this.cache.setActiveUser(userAlias)
      console.log(
        `Successfully seeded user with id: ${userId} and alias: ${userAlias}`
      )
      return
    }
  }

  getAuthenticationHeaders = async ({ alias = '', userId = null }) => {
    await this.setUser({ alias, userId })
    const unixTs = Math.round(new Date().getTime() / 1000) // current unix timestamp (sec)
    const message = `Click sign to authenticate with identity service: ${unixTs}`
    const signature = await this.libs.web3Manager.sign(message)
    return {
      'Encoded-Data-Message': message,
      'Encoded-Data-Signature': signature
    }
    
  }
}

module.exports = SeedSession
