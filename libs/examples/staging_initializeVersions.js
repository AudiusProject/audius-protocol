const Web3 = require('web3')
const AudiusLibs = require('../src/index')
const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const dataWeb3ProviderEndpoint = 'https://sokol.poa.network:443'
const ethWeb3ProviderEndpoint = 'https://ropsten.infura.io/v3/c569c6faf4f14d15a49d0044e7ddd668'
const dataRegistryAddress = '0x09033761774Fe45F40A47191DdF873F18B62DE05'
const ethRegistryAddress = '0xB631ABAA63a26311366411b2025F0cAca00DE27F'
const ethTokenAddress = '0xF8e679Aa54361467B12c7394BFF57Eb890f6d934'
let latestVersionStr = '0.1.0'

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

switch(args[2]) {
  case 'setversion':
    initializeVersionServiceProviderContracts()
    break
  case 'getclaim':
    getClaimInfo()
    break
  case 'fundclaim':
    fundNewClaim()
    break
  default:
    throwArgError()
}


/*
 *
 * export AUDIUS_PRIVATE_KEY=
   export AUDIUS_OWNER_WALLET=
 * */
function getStagingConfig () {
  let audiusLibsConfig
  let privateKey = getEnv('AUDIUS_PRIVATE_KEY')
  let ownerWallet = getEnv('AUDIUS_OWNER_WALLET')
  if (!privateKey || !ownerWallet) {
    throw new Error('Missing private key or owner wallet')
  }
  console.log('Querying environment variables:')
  console.log(privateKey)
  console.log(ownerWallet)

  const dataWeb3 = new Web3(new Web3.providers.HttpProvider(dataWeb3ProviderEndpoint))
  let web3DataContractConfig = {
    registryAddress: dataRegistryAddress,
    useExternalWeb3: true,
    externalWeb3Config: {
      web3: dataWeb3,
      ownerWallet: ownerWallet
    }
  }

  const ethWeb3 = new Web3(new Web3.providers.HttpProvider(ethWeb3ProviderEndpoint))
  audiusLibsConfig = {
    web3Config: web3DataContractConfig,
    ethWeb3Config: AudiusLibs.configEthWeb3(
      ethTokenAddress, // Token Address
      ethRegistryAddress,
      ethWeb3,
      ownerWallet
    ),
    discoveryProviderConfig: AudiusLibs.configDiscoveryProvider(true),
    isServer: isServer
  }
  return audiusLibsConfig
}

async function getAudiusLibs () {
  let config = getStagingConfig()
  let audiusLibs = new AudiusLibs(config)
  await audiusLibs.init()
  return audiusLibs
}

async function getStakingParameters () {
  let audiusLibs = await getAudiusLibs()
  let min = await audiusLibs.ethContracts.StakingProxyClient.getMinStakeAmount()
  let max = await audiusLibs.ethContracts.StakingProxyClient.getMaxStakeAmount()
  console.log(`Min: ${min}`)
  console.log(`Max: ${max}`)
}


async function getClaimInfo () {
  // @dev - audius instance numbering is off-by-1 from accounts to
  //  align with creator/track numbering below, which are 1-indexed
  let audiusLibs = await getAudiusLibs()
  console.log(await audiusLibs.ethContracts.StakingProxyClient.getClaimInfo())
}

async function initializeVersionServiceProviderContracts () {
  let audiusLibs = await getAudiusLibs()

  console.log('----version init---')
  let testTx = null
  let privateKey = getEnv('AUDIUS_PRIVATE_KEY')

  /*
  for (const serviceType of serviceTypeList) {
    console.log(`\nregistering ${serviceType}`)
    try {
      testTx = await audiusLibs.ethContracts.VersioningFactoryClient.setServiceVersion(
        serviceType,
        latestVersionStr,
        privateKey)
      console.log(testTx)
    } catch (e) {
      if (!e.toString().includes('Already registered')) {
        console.log(e)
      } else {
        console.log('Already registered')
      }
    }
  }
  */
  for (const serviceType of serviceTypeList) {
    let versionTx = await audiusLibs.ethContracts.VersioningFactoryClient.getCurrentVersion(serviceType)
    let numVersionsTx = await audiusLibs.ethContracts.VersioningFactoryClient.getNumberOfVersions(serviceType)
    console.log(`${serviceType} | current version: ${versionTx} | number of versions : ${numVersionsTx}`)
  }

  console.log('/----version init---')
  process.exit()
}

async function fundNewClaim () {
  let audiusLibs = await getAudiusLibs()

  // Set default claim to 1,000,000 tokens
  const claimAmountInAUDS = 1000000
  const libOwner = audiusLibs.ethContracts.ethWeb3Manager.getWalletAddress()

  console.log('/---- Funding new claim')
  let bal = await audiusLibs.ethContracts.AudiusTokenClient.balanceOf(libOwner)
  console.log(bal)
  let dataWeb3 = audiusLibs.contracts.web3Manager.getWeb3()
  let claimAmountInAudWei = dataWeb3.utils.toWei(claimAmountInAUDS.toString(), 'ether')
  let claimAmountInAudWeiBN = dataWeb3.utils.toBN(claimAmountInAudWei)
  console.log(claimAmountInAudWeiBN)
  let privateKey = getEnv('AUDIUS_PRIVATE_KEY')

  console.log(privateKey)
  // Actually perform fund op
  let tx = await audiusLibs.ethContracts.StakingProxyClient.fundNewClaim(claimAmountInAudWeiBN, privateKey)
  console.log(tx)
  console.log('/---- End funding new claim')

  await getClaimInfo()
}

