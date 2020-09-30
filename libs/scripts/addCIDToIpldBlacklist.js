const { getDataContractAccounts } = require('../initScripts/helpers/utils')
const contractConfig = require('../../contracts/contract-config.js')
const AudiusLibs = require('../src')
const Web3 = require('../src/web3')
const dataContractsConfig = require('../data-contracts/config.json')
const ethContractsConfig = require('../eth-contracts/config.json')
// const { initializeLibConfig, audiusLibsConfigStaging } = require('../tests/helpers')
const Utils = require('../src/utils')

const networks = new Set([
  'development',
  'test_local',
  // disable mainnet keys for now
  /* 'audius_private',
  'poa_mainnet', */
  'poa_sokol' // staging
])

const dataWeb3ProviderEndpoint = 'http://localhost:8545'
const ethWeb3ProviderEndpoint = 'http://localhost:8546'
const dataWeb3 = new Web3(new Web3.providers.HttpProvider(dataWeb3ProviderEndpoint))
const ethWeb3 = new Web3(new Web3.providers.HttpProvider(ethWeb3ProviderEndpoint))

let config

// node addCIDToIpldBlacklist.js <env> <cid>
// From libs root:
// node scripts/addCIDToIpldBlacklist.js development QmSH5gJPHg9xLzV823ty8BSGyHNP6ty22bgLsv5MLY3kBq

async function run () {
  try {
    const { network, cid } = parseArgs()
    let decodedCID = decodeCID(cid)
    config = contractConfig[network]
    // note: can extract private key here if necessary
    const { BLACKLISTER_PUBLIC_KEY, BLACKLISTER_PRIVATE_KEY } = await getBlacklisterKeys(network)
    const audiusLibs = await createAndInitLibs(network, BLACKLISTER_PUBLIC_KEY)
    const ipldTxReceipt = await addIPLDTxToChain(audiusLibs, decodedCID.digest, BLACKLISTER_PRIVATE_KEY)

    console.log(`Successfully added ${cid} to chain! \nIpld Tx Receipt:`)
    console.log(ipldTxReceipt)

    console.log(
      '\nYou might need to wait a full 60s cycle for your CID to be added to the IPLD blacklist table!'
    )

    // manually check ipld blacklist table to see if CID was added
    // NOTE: might need to wait ~60s
  } catch (e) {
    console.error(e.message)
    if (e.message.includes('Incorrect script usage')) {
      console.log('Available environments are:')
      console.log(networks)
    }
  }
}

// get appropriate args from CLI
function parseArgs () {
  console.log('Parsing args...')
  // const args = process.argv.slice(2)
  // const network = args[0]
  // const cid = args[1]
  const network = 'poa_sokol'
  const cid = 'QmZJoajhh4MQUtGeSfpWbWAsdvfdC11MDwEk3sjufUQFEH'

  // check appropriate CLI usage
  if (!network || !cid || !networks.has(network)) {
    let errorMessage = `Incorrect script usage for input env (${network}) and (cid) ${cid}.`
    errorMessage += "\nPlease follow the structure 'node addCIDToIpldBlacklist.js <env> <cid>'"
    throw new Error(errorMessage)
  }

  return { network, cid }
}

// transform CID into a readable digest
function decodeCID (cid) {
  console.log('Transforming CID into a readable digest....')
  let decodedCID
  try {
    decodedCID = Utils.decodeMultihash(cid)
  } catch (e) {
    throw new Error(`Error with decoding input CID ${cid}: ${e}`)
  }
  return decodedCID
}

// get key according to environmnet
async function getBlacklisterKeys (network) {
  console.log(`Getting the proper blacklister keys for ${network}...`)
  let BLACKLISTER_PUBLIC_KEY
  let BLACKLISTER_PRIVATE_KEY = null

  // if local dev, grab priv/pub keys from local ganache chain
  // else, grab key from config
  // NOTE: for local dev, wallet[0] is unlocked and does not require a private key
  switch (network) {
    case 'poa_sokol': {
      BLACKLISTER_PUBLIC_KEY = config.blacklisterAddress
      BLACKLISTER_PRIVATE_KEY = 'ebba299e6163ff3208de4e82ce7db09cf7e434847b5bdab723af96ae7c763a0e'
      break
    }
    case 'development':
    case 'test_local': {
      const ganacheContractsAccounts = await getDataContractAccounts()
      const keyPairs = ganacheContractsAccounts.private_keys
      BLACKLISTER_PUBLIC_KEY = Object.keys(keyPairs)[0]
      BLACKLISTER_PRIVATE_KEY = keyPairs[BLACKLISTER_PUBLIC_KEY]
      break
    }
    default: {
      throw new Error(`Unrecognizable environment ${network}`)
    }
  }
  return { BLACKLISTER_PUBLIC_KEY, BLACKLISTER_PRIVATE_KEY }
}

// init libs with blacklister public address
async function createAndInitLibs (network, blacklisterPublicKey) {
  console.log('Initializing libs....')
  let audiusLibs
  try {
    let libsConfig
    switch (network) {
      case 'poa_sokol': {
        libsConfig = await initializeLibConfigStaging(blacklisterPublicKey)
        break
      }
      case 'development':
      case 'test_local': {
        libsConfig = await initializeLibConfig(blacklisterPublicKey)
        break
      }
      default: {
        throw new Error(`Unrecognizable environment ${network}`)
      }
    }

    audiusLibs = new AudiusLibs(libsConfig)
    await audiusLibs.init()

    // Set owner wallet manually since configuring internal web3 doesnt allow you to enter wallet
    audiusLibs.web3Manager.setOwnerWallet({ getAddressString: () => '0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0' })
  } catch (e) {
    throw new Error(`Error with initializing libs: ${e}`)
  }

  return audiusLibs
}

// add cid to ipld blacklist
async function addIPLDTxToChain (audiusLibs, digest, privateKey) {
  console.log('Adding ipld transaction to chain...')
  let ipldTxReceipt
  try {
    // const balance = await audiusLibs.web3Manager.getWeb3().eth.getBalance('0xbbbb93a6b3a1d6fdd27909729b95ccb0cc9002c0')
    // console.log(`this is the balance ${balance}`)

    // console.log('the wallet addr')
    // console.log(audiusLibs.web3Manager.getWalletAddress())
    ipldTxReceipt = await audiusLibs.contracts.IPLDBlacklistFactoryClient.addIPLDToBlacklist(
      digest,
      privateKey
    )
  } catch (e) {
    throw new Error(`Error with adding IPLD blacklist txn: ${e}`)
  }

  return ipldTxReceipt
}

const initializeLibConfigStaging = wallet => {
  return {
    // web3Config: AudiusLibs.configExternalWeb3(
    //   '0x793373aBF96583d5eb71a15d86fFE732CD04D452',
    //   new Web3(new Web3.providers.HttpProvider('https://sokol.poa.network/')),
    //   null, // networkId
    //   wallet, // 0xbbbb93A6B3A1D6fDd27909729b95CCB0cc9002C0
    //   false // requiresAccount
    // ),
    web3Config: AudiusLibs.configInternalWeb3(
      '0x793373aBF96583d5eb71a15d86fFE732CD04D452',
      ['https://sokol.poa.network']
    ),
    ethWeb3Config: AudiusLibs.configEthWeb3(
      '0xF8e679Aa54361467B12c7394BFF57Eb890f6d934',
      '0xB631ABAA63a26311366411b2025F0cAca00DE27F',
      new Web3(new Web3.providers.HttpProvider('https://eth-ropsten.alchemyapi.io/v2/Y-vE_LXNPnKsbnmaXxAre7t_xI-PA6KU')),
      wallet
    ),
    identityServiceConfig: AudiusLibs.configIdentityService(
      'https://identityservice.staging.audius.co'
    ),
    isServer: true
  }
}

async function initializeLibConfig (ownerWallet) {
  return {
    web3Config: AudiusLibs.configExternalWeb3(
      dataContractsConfig.registryAddress,
      dataWeb3
    ),
    ethWeb3Config: AudiusLibs.configEthWeb3(
      ethContractsConfig.audiusTokenAddress,
      ethContractsConfig.registryAddress,
      ethWeb3,
      ownerWallet
    ),
    isServer: true
  }
}

run()
