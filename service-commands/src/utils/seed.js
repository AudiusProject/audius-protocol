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
  getRandomImageFilePath
} = require('./random')

const getLibsConfig = overrideConfig => {
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
      true,
      CONTENT_NODE_ALLOWLIST
    ),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(),
    identityServiceConfig: AudiusLibs.configIdentityService(
      IDENTITY_SERVICE_ENDPOINT,
      false // use Hedgehog local storage
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true,
    useTrackContentPolling: true
  }

  return Object.assign(audiusLibsConfig, overrideConfig)
}

const camelToKebabCase = str =>
  str
  .replace(/([A-Z])([A-Z])/g, '$1-$2')
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/[\s_]+/g, '-')
  .toLowerCase()

const kebabToCamelCase = str => str.replace(/-./g, x => x[1].toUpperCase())

const parseMetadataIntoObject = (commaSeparatedKeyValuePairs, rootObject = {}) => {
  let metadata = rootObject
  commaSeparatedKeyValuePairs.split(',').forEach(kvPair => {
    let [key, value] = kvPair.split('=')
    if (value === 'true') {
      value = true
    }
    metadata[key] = value
  })
  return metadata
}

const getUserProvidedOrRandomTrackFilePath = async manualOverridePath => {
  let result
  if (manualOverridePath) {
    result = manualOverridePath
  } else {
    result = await getRandomTrackFilePath(TEMP_TRACK_STORAGE_PATH)
  }
  return result
}

const getUserProvidedOrRandomImageFilePath = async manualOverridePath => {
  let result
  if (manualOverridePath) {
    result = manualOverridePath
  } else {
    result = await getRandomImageFilePath(TEMP_IMAGE_STORAGE_PATH)
  }
  return result
}

const getProgressCallback = () => {
  const progressCallback = percentComplete => {
    console.log(`${percentComplete} track upload completed...`)
  }
  return progressCallback
}

const getUserProvidedOrRandomTrackMetadata = userProvidedMetadataInput => {
  // TODO userId passthrough
  let metadataObj = getRandomTrackMetadata()
  if (userProvidedMetadataInput) {
    const userProvidedMetadata = parseMetadataIntoObject(userProvidedMetadataInput)
    metadataObj = Object.assign(metadataObj, userProvidedMetadata)
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

module.exports = {
  getLibsConfig,
  camelToKebabCase,
  kebabToCamelCase,
  parseMetadataIntoObject,
  getUserProvidedOrRandomTrackFilePath,
  getUserProvidedOrRandomImageFilePath,
  getUserProvidedOrRandomTrackMetadata,
  getProgressCallback,
  parseSeedActionRepeatCount
}
