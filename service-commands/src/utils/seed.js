const fs = require('fs')
const _ = require('lodash')
const AudiusLibs = require('@audius/libs')
const {
  TEMP_IMAGE_STORAGE_PATH,
  TEMP_TRACK_STORAGE_PATH,
  ETH_REGISTRY_ADDRESS,
  ETH_TOKEN_ADDRESS,
  ETH_OWNER_WALLET,
  DATA_CONTRACTS_REGISTRY_ADDRESS,
  CONTENT_NODE_ALLOWLIST,
  DATA_CONTRACTS_PROVIDER_ENDPOINTS,
  USER_METADATA_ENDPOINT,
  IDENTITY_SERVICE_ENDPOINT,
  ETH_PROVIDER_ENDPOINT
} = require('./constants')

const {
  getRandomTrackMetadata,
  getRandomTrackFilePath,
  getRandomImageFilePath,
  r6
} = require('./random')

const getLibsConfig = overrideConfig => {
  const useHedgehogLocalStorage = false
  const lazyConnect = true
  const audiusLibsConfig = {
    ethWeb3Config: AudiusLibs.configEthWeb3(
      ETH_TOKEN_ADDRESS,
      ETH_REGISTRY_ADDRESS,
      ETH_PROVIDER_ENDPOINT,
      ETH_OWNER_WALLET
    ),
    web3Config: AudiusLibs.configInternalWeb3(
        DATA_CONTRACTS_REGISTRY_ADDRESS,
        DATA_CONTRACTS_PROVIDER_ENDPOINTS
    ),
    creatorNodeConfig: AudiusLibs.configCreatorNode(
      USER_METADATA_ENDPOINT,
      lazyConnect,
      CONTENT_NODE_ALLOWLIST
    ),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(),
    identityServiceConfig: AudiusLibs.configIdentityService(
      IDENTITY_SERVICE_ENDPOINT,
      useHedgehogLocalStorage
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true,
    useTrackContentPolling: true
  }
  return _.merge(audiusLibsConfig, overrideConfig)
}

const camelToKebabCase = str =>
  str
  .replace(/([A-Z])([A-Z])/g, '$1-$2')
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/[\s_]+/g, '-')
  .toLowerCase()

const kebabToCamelCase = str => str.replace(/-./g, x => x[1].toUpperCase())

const parseMetadataIntoObject = (commaSeparatedKeyValuePairs) => {
  const metadata = {}
  commaSeparatedKeyValuePairs.split(',').forEach(kvPair => {
    let [key, value] = kvPair.split('=')
    if (value === 'true') {
      value = true
    }
    metadata[key] = value
  })
  return metadata
}

const getUserProvidedOrRandomTrackFile = async userInputPath => {
  let path
  if (userInputPath) {
    path = userInputPath
  } else {
    path = await getRandomTrackFilePath(TEMP_TRACK_STORAGE_PATH)
  }
  return fs.createReadStream(path)
}

const getUserProvidedOrRandomImageFile = async userInputPath => {
  let path
  if (userInputPath) {
    path = userInputPath
  } else {
    path = await getRandomImageFilePath(TEMP_IMAGE_STORAGE_PATH)
  }
  return null// fs.createReadStream(path) TODO figure this out - has to do with issue referenced here https://github.com/AudiusProject/audius-protocol/blob/926129262e/service-commands/src/commands/users.js#L15-L19
}

const getProgressCallback = () => {
  const progressCallback = percentComplete => {
    console.log(`${percentComplete} track upload completed...`)
  }
  return progressCallback
}

const getUserProvidedOrRandomTrackMetadata = (userProvidedMetadataInput, seedSession) => {
  const { userId } = seedSession.cache.getActiveUser()
  let metadataObj = getRandomTrackMetadata(userId)
  if (userProvidedMetadataInput !== 'random') {
    const userProvidedMetadata = parseMetadataIntoObject(userProvidedMetadataInput)
    metadataObj = Object.assign(metadataObj, userProvidedMetadata, { })
  }
  return metadataObj
}

const parseSeedActionRepeatCount = userInput => {
  let count
  if (userInput) {
    try {
      count = Number(userInput)
    } catch (e) {
      throw new Error(`${userInput} cannot be converted to a number for repeating seed actions.`)
    }
  }
  return count
}

const passThroughUserInput = userInput => userInput

const getRandomUserIdFromCurrentSeedSessionCache = (userInput, seedSession) => {
  let userId
  if (userInput) {
    userId = userInput
  } else {
    const activeUser = seedSession.cache.getActiveUser()
    const cachedUsers = seedSession.cache.getUsers()
    const randomUsersPool = cachedUsers.filter(u => u.userId !== activeUser.userId)
    const randomUser = _.sample(randomUsersPool)
    userId = randomUser.userId
  }
  return userId
}

const getRandomTrackIdFromCurrentSeedSessionCache = (userInput, seedSession) => {
  let trackId
  if (userInput) {
    trackId = userInput
  } else {
    const cachedTracks = seedSession.cache.getTracks()
    trackId = _.sample(cachedTracks)
  }
  return trackId
}

const addTrackToSeedSessionCache = (response, seedSession) => {
  const { trackId } = response
  const { userId } = seedSession.cache.getActiveUser()
  seedSession.cache.addTrackToCachedUserDetails({ trackId, userId })
}

const getActiveUserFromSeedSessionCache = (userInput, seedSession) => {
  const activeUser = seedSession.cache.getActiveUser()
  return activeUser.userId
}

const getRandomString = () => {
  return r6()
}


module.exports = {
  getLibsConfig,
  camelToKebabCase,
  kebabToCamelCase,
  parseMetadataIntoObject,
  getUserProvidedOrRandomTrackFile,
  getUserProvidedOrRandomImageFile,
  getUserProvidedOrRandomTrackMetadata,
  getProgressCallback,
  parseSeedActionRepeatCount,
  passThroughUserInput,
  getRandomUserIdFromCurrentSeedSessionCache,
  getRandomTrackIdFromCurrentSeedSessionCache,
  addTrackToSeedSessionCache,
  getActiveUserFromSeedSessionCache,
  getRandomString
}
