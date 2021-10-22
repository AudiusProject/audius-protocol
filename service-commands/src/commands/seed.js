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

const localStorage = new LocalStorage('./local-storage')

const HEDGEHOG_ENTROPY_KEY = 'hedgehog-entropy-key'
const USER_CACHE_PATH = `${process.env.PROTOCOL_DIR}/../.audius/seed-users-config.json`

const updateUserCache = (cacheObject) => {
  fs.writeFileSync(USER_CACHE_PATH, JSON.stringify(cacheObject))
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
  const match = (alias, { hedgehogEntropyKey }) => {
    hedgehogEntropyKey === entropy
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

// TODO
const seedCLIToCommandMap = {
  'upload-track': {
    api: 'Track',
    method: 'uploadTrack',
    options: [
      'trackFile',
      'coverArtFile',
      'metadata',
      'onProgress' // pass in onProgress from wrapper?
    ]
  },
  'follow-user': {
    api: 'User',
    method: 'addUserFollow',
    options: [
      'followeeUserId'
    ]
  },
  'add-track-repost': {
    api: 'Track',
    method: 'addTrackRepost',
    options: [
      'userId',
      'trackId'
    ]
  }
}

const Seed = {}

Seed.init = async () => {
    clearUserCache()
    const libsConfig = getLibsConfig()
    this.libs = new AudiusLibs(libsConfig)
    await this.libs.init()
    const hedgehogEntropyKey = localStorage.getItem(HEDGEHOG_ENTROPY_KEY)
    addToUserCache({ alias: 'root', hedgehogEntropyKey })
    // TODO set up seed dump file
}

Seed.getUsers = async () => {
  return getUserCache()
}

Seed.clearSession = async () => {
    this.libs = undefined
    clearUserCache()
}

Seed.setUser = async ({ alias = '', userId = '' }) => {
    const userCache = this.getUsers()
    const match = (alias, { userId }) => {
      return alias === alias || userId === userId
    }
    const user = Object.entries(userCache).find(match) || {}
    if (!user.hedgehogEntropyKey) {
      console.error(`No user with alias ${alias} or id ${userId} found in local seed cache.`)
    } else {
      localStorage.setItem(HEDGEHOG_ENTROPY_KEY, user.hedgehogEntropyKey)
    }
    await this.libs.init()
}

Seed.createUser = async (alias, options) => {
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
    const hedgehogEntropyKey = localStorage.getItem(HEDGEHOG_ENTROPY_KEY)
    const userId = signUpResponse.userId
    if (!alias) {
      alias = hedgehogEntropyKey
    }
    addToUserCache({ alias, hedgehogEntropyKey, userId })
    addLoginDetailsToCache({ entropy: hedgehogEntropyKey, email, password })
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

