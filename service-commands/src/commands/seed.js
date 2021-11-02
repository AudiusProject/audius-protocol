const fs = require('fs')
const AudiusLibs = require('@audius/libs')
const { LocalStorage } = require('node-localstorage')

const {
  getLibsConfig,
  getRandomEmail,
  getRandomPassword,
  getRandomUserMetadata
} = require('./utils')

const HEDGEHOG_ENTROPY_KEY = 'hedgehog-entropy-key'
class UserCache {
  constructor() {
    this.USER_CACHE_PATH = `${process.env.PROTOCOL_DIR}/../.audius/seed-users-config.json`
  }

  update = (cacheObject) => {
    fs.writeFileSync(this.USER_CACHE_PATH, JSON.stringify(cacheObject))
    return
  }

  getActiveUser = () => {
    const cache = this.get()
    const activeAlias = cache['active']
    return cache[activeAlias] || {}
  }

  setActiveUser = alias => {
    let cache = this.get()
    cache['active'] = alias
    this.update(cache)
  }

  addUser = ({ alias, hedgehogEntropyKey, userId = null }) => {
    let cache = this.get()
    cache[alias] = {
      userId,
      hedgehogEntropyKey
    }
    this.update(cache)
  }

  addLoginDetails = ({ entropy, email, password }) => {
    const match = ([alias, { hedgehogEntropyKey }]) => {
      return hedgehogEntropyKey === entropy
    }
    let cache = this.get()
    const [alias, info] = Object.entries(cache).find(match)
    cache[alias] = Object.assign(info, { email, password })
    this.update(cache)
  }

  get = () => {
    let cache
    if (fs.existsSync(this.USER_CACHE_PATH)) {
      cache = JSON.parse(fs.readFileSync(this.USER_CACHE_PATH))
    } else {
      cache = {}
    }
    return cache
  }

  findUser = ({ alias, userId }) => {
    const cache = this.get()
    const match = ([cacheAlias, { userId: cacheUserId }]) => {
      return alias === cacheAlias || userId == cacheUserId
    }
    const [userAlias, userDetails] = Object.entries(cache).find(match) || {}
    return Object.assign(userDetails, { userAlias })
  }

  clear = () => {
    this.update({})
  }
}
class LocalStorageWrapper {
  // local storage wrapper functions - because different instances of
  // localstorage in node don't sync, we must reinstantiate from the path
  // with each read/write to ensure we're getting the correct reference.
  constructor () {}

  get = () => {
    return new LocalStorage(`${process.env.PROTOCOL_DIR}/service-commands/local-storage`)
  }

  getUserEntropy = () => {
    const localStorage = this.get()
    const entropy = localStorage.getItem(HEDGEHOG_ENTROPY_KEY)
    return entropy
  }

  setUserEntropy = hedgehogEntropyKey => {
    const localStorage = this.get()
    localStorage.setItem(HEDGEHOG_ENTROPY_KEY, hedgehogEntropyKey)
  }

  clear = () => {
    const localStorage = this.get()
    localStorage.clear()
  }
}
class Seed {
  constructor() {
    this.cache = new UserCache()
    this.localstorage = new LocalStorageWrapper()
  }

  init = async (libsConfigOverride = {}) => {
      const libsConfig = getLibsConfig(libsConfigOverride)
      this.libs = new AudiusLibs(libsConfig)
      await this.libs.init()
      // TODO set up seed dump file
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
        console.log(`Successfully set user with alias ${alias} / id ${userId} as active.`)
      }
      const libsConfigOverride = {
        identityServiceConfig: {
          useHedgehogLocalStorage: true
        }
      }
      await this.init(libsConfigOverride)
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
    const signUpResponse = await this.libs.Account.signUp(email, password, metadata)
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
      return
    }
  }
  // TODO API methods that call through to CLI things (wrapper layer)?
}

// TODO seed with --file argument that parses JSON or iterates through?
module.exports = Seed
