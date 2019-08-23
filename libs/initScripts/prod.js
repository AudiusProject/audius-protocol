const initAudiusLibs = require('../examples/initAudiusLibs')
const { distributeTokens } = require('./helpers/distributeTokens')
const { setServiceVersion } = require('./helpers/version')
const { registerLocalService, queryLocalServices, getStakingParameters } = require('./helpers/spRegistration')
const { deregisterLocalService } = require('./helpers/spRegistration')
const { getClaimInfo, fundNewClaim } = require('./helpers/claim')


const AudiusLibs = require('../src/index')
const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const config = require('./prod-config.json')

const isServer = true

const getEnv = env => {
  const value = process.env[env]
  if (typeof value === 'undefined') {
    console.log(`${env} has not been set.`)
    return null
  }
  return value
}

function throwArgError () {
  throw new Error('missing argument - format: node examples/staging_initializeVersions.js [setversion, fundclaim, getclaim, stakeinfo]')
}

let args = process.argv
if (args.length < 3) {
  throwArgError()
}

const run = async () => {
  try {
    let audiusLibs = await getAudiusLibs()
    let privateKey = getEnv('AUDIUS_PRIVATE_KEY')
    let ownerWallet = getEnv('AUDIUS_OWNER_WALLET')
    switch(args[2]) {
      case 'setversion':
        if (!args[3] || !args[4])
          throw new Error('missing arguments - format: node prod.js setversion <serviceType> <versionStr>')
        
        const serviceType = args[3]
        const versionStr = args[4]
        await setServiceVersion(audiusLibs, serviceType, versionStr, privateKey)
        break
      case 'getclaim':
        await getClaimInfo(audiusLibs)
        break
      case 'fundclaim':
        if(!args[3])
          throw new Error('missing argument - format: node prod.js fundclaim <claimAmountInAUDS>')
        
        const claimAmountInAUDS = args[3]
        await fundNewClaim(audiusLibs, claimAmountInAUDS, privateKey)
        break
      case 'stakeinfo':
        await getStakingParameters(audiusLibs)
        break
      default:
        throwArgError()
    }

    process.exit(0)
  } catch(e) {
    throw e
  }
}

run()

function getLibsConfig () {
  let audiusLibsConfig
  let privateKey = config.audiusPrivateKey
  let ownerWallet = config.audiusOwnerWallet
  if (!privateKey || !ownerWallet) {
    throw new Error('Missing private key or owner wallet')
  }
  console.log('Querying environment variables:')
  console.log(privateKey)
  console.log(ownerWallet)

  const dataWeb3 = new Web3(new Web3.providers.HttpProvider(config.dataWeb3ProviderEndpoint))
  let web3DataContractConfig = {
    registryAddress: config.dataRegistryAddress,
    useExternalWeb3: true,
    externalWeb3Config: {
      web3: dataWeb3,
      ownerWallet: ownerWallet
    }
  }

  const ethWeb3 = new Web3(new Web3.providers.HttpProvider(config.ethWeb3ProviderEndpoint))
  audiusLibsConfig = {
    web3Config: web3DataContractConfig,
    ethWeb3Config: AudiusLibs.configEthWeb3(
      config.ethTokenAddress, // Token Address
      config.ethRegistryAddress,
      ethWeb3,
      ownerWallet
    ),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(true),
    isServer: isServer
  }
  return audiusLibsConfig
}

async function getAudiusLibs () {
  let config = getLibsConfig()
  let audiusLibs = new AudiusLibs(config)
  await audiusLibs.init()
  return audiusLibs
}
