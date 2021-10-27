const AudiusLibs = require('@audius/libs')
const moment = require('moment')
const dotenv = require('dotenv').config({
  path: `${process.env.PROTOCOL_DIR}/service-commands/.env.dev`
})

// CONFIG - from sauron https://github.com/AudiusProject/sauron/blob/master/config.js
const ethContractsConfig = require(`${process.env.PROTOCOL_DIR}/../.audius/eth-config.json`)
const dataContractsConfig = require(`${process.env.PROTOCOL_DIR}/../.audius/config.json`)
const ETH_REGISTRY_ADDRESS = ethContractsConfig.registryAddress
const ETH_TOKEN_ADDRESS = ethContractsConfig.audiusTokenAddress
const ETH_OWNER_WALLET = ethContractsConfig.ownerWallet
const DATA_CONTRACTS_REGISTRY_ADDRESS = dataContractsConfig.registryAddress

const getLibsConfig = (overrideConfig) => {
  const contentNodeAllowlist = process.env.CONTENT_NODE_ALLOWLIST
    ? new Set(process.env.CONTENT_NODE_ALLOWLIST.split(','))
    : undefined

    const audiusLibsConfig = {
    ethWeb3Config: AudiusLibs.configEthWeb3(
      process.env.ETH_TOKEN_ADDRESS || ETH_TOKEN_ADDRESS,
      process.env.ETH_REGISTRY_ADDRESS || ETH_REGISTRY_ADDRESS,
      process.env.ETH_PROVIDER_ENDPOINT,
      process.env.ETH_OWNER_WALLET || ETH_OWNER_WALLET
    ),
    web3Config: AudiusLibs.configInternalWeb3(
      process.env.DATA_CONTRACTS_REGISTRY_ADDRESS || DATA_CONTRACTS_REGISTRY_ADDRESS,
      [process.env.DATA_CONTRACTS_PROVIDER_ENDPOINT]
    ),
    creatorNodeConfig: AudiusLibs.configCreatorNode(
      process.env.USER_METADATA_ENDPOINT,
      true,
      contentNodeAllowlist
    ),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(),
    identityServiceConfig: AudiusLibs.configIdentityService(
      process.env.IDENTITY_SERVICE_ENDPOINT,
      false // use Hedgehog local storage
    ),
    isServer: true,
    enableUserReplicaSetManagerContract: true,
    useTrackContentPolling: true
  }

  return Object.assign(audiusLibsConfig, overrideConfig)
}

const camelToKebabCase = str => str
    .replace(/([A-Z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

const kebabToCamelCase = str => str.replace(/-./g, x => x[1].toUpperCase())

const isUpperCase = char => char !== char.toLowerCase() && char === char.toUpperCase()

const getParamNames = func => {
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
    const ARGUMENT_NAMES = /([^\s,]+)/g
    let fnStr = func.toString().replace(STRIP_COMMENTS, '')
    let paramNames = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES)
    if (paramNames === null) {
        paramNames = []
    }
    return paramNames
}

const getRandomEmail = (root = '') => {
    const sauronSuffix = moment().format('YYMMDD') + Math.random().toString(36).substring(2, 6)
    let email
    if (root) {
      const [user, domain] = root.split('@')
      email = [user, '+', sauronSuffix, '@', domain].join('')
    } else {
      email = ['service-commands-seed', '+', sauronSuffix, '@', 'audius.co'].join('')
    }
    return email
}

const getRandomPassword = () => {
    return 'wordpass'
}

// TODO put the following in libs so it can be required in both sauron and here?
/**
 * Generates a single random user with the random suffix of
 * <spId>_<YYMMDDxxxxxx>
 * YY - year (ex.: the 21 part of 2021)
 * MM - month
 * DD - day
 * xxxxxx - random string of lowercase letters + numbers (just to ensure randomness)
 *
 * ex: 'seed_210331abc123
 * @param {string} sauronSuffix a string with the pattern YYMMDDxxxxxx
 * @returns the user metadata object
 */
 const getRandomUserMetadata = (email, password) => {
     const sauronSuffix = moment().format('YYMMDD') + Math.random().toString(36).substring(2, 6)
    return {
      name: `seed_${sauronSuffix}`,
      email,
      password,
      handle: `seed_${sauronSuffix}`,
      bio: `seed_bio_${sauronSuffix}`,
      location: `seed_loc_${sauronSuffix}`,
      is_creator: false,
      is_verified: false,
      profile_picture: null,
      profile_picture_sizes: null,
      cover_photo: null,
      cover_photo_sizes: null,
      creator_node_endpoint: process.env.USER_METADATA_ENDPOINT
    }
  }

module.exports = {
    getLibsConfig,
    camelToKebabCase,
    kebabToCamelCase,
    isUpperCase,
    getRandomUserMetadata,
    getRandomPassword,
    getRandomEmail
}
