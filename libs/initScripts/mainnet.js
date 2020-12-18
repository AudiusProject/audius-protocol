const Web3 = require('../src/web3')
const path = require('path')

const { setServiceVersion, addServiceType } = require('./helpers/version')
const { getStakingParameters } = require('./helpers/spRegistration')
const { initiateRound, getLastFundedBlock } = require('./helpers/initiateRound')

const AudiusLibs = require('../src/index')

const isServer = true

let args = process.argv
if (args.length < 3) {
  _throwArgError()
}

/*
 *
 * export AUDIUS_PRIVATE_KEY=
   export AUDIUS_OWNER_WALLET=
 * */
const run = async () => {
  try {
    let configFile = args[2]
    let commandToRun = args[3]
    const config = require(path.join(__dirname, configFile))

    let privateKey = _getEnv('AUDIUS_PRIVATE_KEY')
    let ownerWallet = _getEnv('AUDIUS_OWNER_WALLET')
    let audiusLibs = await getAudiusLibs(config, privateKey, ownerWallet)
    switch (commandToRun) {
      case 'setversion':
        const serviceType = args[4]
        const versionStr = args[5]
        if (!serviceType || !versionStr) {
          throw new Error('missing arguments - format: node mainnet.js setversion <serviceType> <versionStr>')
        }
        await setServiceVersion(audiusLibs, serviceType, versionStr, privateKey)
        break
      case 'addservicetype':
        const newServiceType = args[4]
        const serviceTypeMin = args[5]
        const serviceTypeMax = args[6]
        if (!newServiceType || !serviceTypeMin || !serviceTypeMax) {
          throw new Error('missing arguments - format: node mainnet.js addservicetype <serviceType> <serviceTypeMin> <serviceTypeMax>')
        }
        await addServiceType(audiusLibs, newServiceType, serviceTypeMin, serviceTypeMax, privateKey)
        break
      case 'stakeinfo':
        await getStakingParameters(audiusLibs)
        break
      case 'initiate-round':
        await initiateRound(audiusLibs, privateKey)
        break
      case 'last-funded-block':
        await getLastFundedBlock(audiusLibs)
        break
      default:
        _throwArgError()
    }

    process.exit(0)
  } catch (e) {
    throw e
  }
}

run()

function getLibsConfig (config, privateKey, ownerWallet) {
  let audiusLibsConfig
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
    // discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(),
    isServer: isServer
  }
  return audiusLibsConfig
}

async function getAudiusLibs (config, privateKey, ownerWallet) {
  let audiusLibsConfig = getLibsConfig(config, privateKey, ownerWallet)
  let audiusLibs = new AudiusLibs(audiusLibsConfig)
  await audiusLibs.init()
  return audiusLibs
}

function _getEnv (env) {
  const value = process.env[env]
  if (typeof value === 'undefined') {
    throw new Error(`${env} has not been set.`)
  }
  return value
}

function _throwArgError () {
  throw new Error('missing argument - format: node mainnet.js <configFilePath> [setversion, fundclaim, getclaim, stakeinfo] [additional options]')
}
