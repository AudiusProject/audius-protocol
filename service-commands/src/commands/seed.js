const fs = require('fs')
const { LocalStorage } = require('node-localstorage')
const AudiusLibs = require('@audius/libs')

const {
  getLibsConfig,
  camelToKebabCase,
  kebabToCamelCase,
  getRandomEmail,
  getRandomPassword,
  getRandomUserMetadata
} = require('./utils')

const HEDGEHOG_ENTROPY_KEY = 'hedgehog-entropy-key'
const USER_CACHE_PATH = `${process.env.PROTOCOL_DIR}/../.audius/seed-users-config.json`

const UserCache = {} // TODO refactor into a real-deal class

const updateUserCache = (cacheObject) => {
  fs.writeFileSync(USER_CACHE_PATH, JSON.stringify(cacheObject))
  return
}

const getActiveUserFromCache = () => {
  const userCache = getUserCache()
  const activeAlias = userCache['active']
  return userCache[activeAlias]
}

const setActiveUserInCache = alias => {
  let userCache = getUserCache()
  userCache['active'] = alias
  updateUserCache(userCache)
}

const addToUserCache = ({ alias, hedgehogEntropyKey, userId = null }) => {
  let userCache = getUserCache()
  userCache[alias] = {
    userId,
    hedgehogEntropyKey
  }
  updateUserCache(userCache)
}

const addLoginDetailsToCache = ({ entropy, email, password }) => {
  const match = ([alias, { hedgehogEntropyKey }]) => {
    return hedgehogEntropyKey === entropy
  }
  let userCache = getUserCache()
  const [alias, info] = Object.entries(userCache).find(match)
  userCache[alias] = Object.assign(info, { email, password })
  updateUserCache(userCache)
}
const getUserCache = () => {
  let userCache
  if (fs.existsSync(USER_CACHE_PATH)) {
    userCache = JSON.parse(fs.readFileSync(USER_CACHE_PATH))
  } else {
    userCache = {}
  }
  return userCache
}

const clearUserCache = () => {
  updateUserCache({})
}

const getLocalStorageReference = () => {
  const localStorage = new LocalStorage(`${process.env.PROTOCOL_DIR}/service-commands/local-storage`)
  return localStorage
}

class Seed {
  constructor() {
  }

  getUserEntropyFromLocalStorage = () => {
    const localStorage = getLocalStorageReference()
    const entropy = localStorage.getItem(HEDGEHOG_ENTROPY_KEY)
    return entropy
  }

  init = async (libsConfigOverride = {}) => {
      const libsConfig = getLibsConfig(libsConfigOverride)
      this.libs = new AudiusLibs(libsConfig)
      await this.libs.init()
      // TODO set up seed dump file
  }

  setUserEntropyInLocalStorage = hedgehogEntropyKey => {
    const localStorage = getLocalStorageReference()
    localStorage.setItem(HEDGEHOG_ENTROPY_KEY, hedgehogEntropyKey)
  }

  clearLocalStorage = () => {
    const localStorage = getLocalStorageReference()
    localStorage.clear()
  }

  clearSession = async () => {
      this.clearLocalStorage()
      this.libs = undefined
      clearUserCache()
  }

  setUser = async ({ alias = '', userId = null }) => {
      const userCache = getUserCache()
      const match = ([cacheAlias, { userId: cacheUserId }]) => {
        console.log(cacheAlias, cacheUserId)
        return alias === cacheAlias || userId == cacheUserId
      }
      const [userAlias, userDetails] = Object.entries(userCache).find(match) || {}
      if (!userDetails.hedgehogEntropyKey) {
        console.error(`No user with alias ${alias} or id ${userId} found in local seed cache.`)
      } else {
        this.setUserEntropyInLocalStorage(userDetails.hedgehogEntropyKey)
        setActiveUserInCache(userAlias)
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
      const hedgehogEntropyKey = this.getUserEntropyFromLocalStorage()
      const userId = signUpResponse.userId
      if (!alias) {
        alias = hedgehogEntropyKey
      }
      addToUserCache({ alias, hedgehogEntropyKey, userId })
      addLoginDetailsToCache({ entropy: hedgehogEntropyKey, email, password })
      setActiveUserInCache(alias)
      return
    }
  }
}

// Seed.setupCommands = (program) => {
//     Object.entries(seedCLIToCommandMap).forEach(({ cliCommand, config }) => {
//       program.command(cliCommand)
//       // call command.option for each option in config.options
//       .action(async (options) => {
//         if (!this.libs) {
//           await this.init() // TODO accept userId - or make this explicit via seed.setUser?
//         }
//         this.libs[config.api][config.method](...options)
//       })
//     })
//     LIBS_API_CLASSES.forEach(className => {
//         const api = this.libs[className]
//         setupCommands(api, className, program)
//     })
// }

// TODO seed with --file argument that parses JSON or iterates through?
module.exports = Seed

