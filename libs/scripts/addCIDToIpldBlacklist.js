const { getDataContractAccounts } = require('../initScripts/helpers/utils')
const contractConfig = require('../../contracts/contract-config.js')
const AudiusLibs = require('../src')
const { initializeLibConfig } = require('../tests/helpers')
const Utils = require('../src/utils')

const networks = new Set([
  'development',
  'test'
])

let config

// node addCIDToIpldBlacklist.js <env> <cid>
// From libs root:
// node scripts/addCIDToIpldBlacklist.js development QmSH5gJPHg9xLzV823ty8BSGyHNP6ty22bgLsv5MLY3kBq

async function run() {
  try {
    const { network, cid } = parseArgs()
    const decodedCID = decodeCID(cid)
    config = contractConfig[network]
    // note: can extract private key here if necessary
    const { BLACKLISTER_PUBLIC_KEY } = await getBlacklisterKeys(network)
    const audiusLibs = await createAndInitLibs(BLACKLISTER_PUBLIC_KEY)
    const ipldTxReceipt = await addIPLDTxToChain(audiusLibs, decodedCID.digest)

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
function parseArgs() {
  const args = process.argv.slice(2)
  const network = args[0]
  const cid = args[1]

  // check appropriate CLI usage
  if (!network || !cid || !networks.has(network)) {
    let errorMessage = `Incorrect script usage for input env (${network}) and (cid) ${cid}.`
    errorMessage += "\nPlease follow the structure 'node addCIDToIpldBlacklist.js <env> <cid>'"
    throw new Error(errorMessage)
  }

  return { network, cid }
}

// transform CID into a readable digest
function decodeCID(cid) {
  let decodedCID
  try {
    decodedCID = Utils.decodeMultihash(cid)
  } catch (e) {
    throw new Error(`Error with decoding input CID ${cid}: ${e}`)
  }
  return decodedCID
}

// get key according to environmnet
async function getBlacklisterKeys(network) {
  let BLACKLISTER_PUBLIC_KEY
  let BLACKLISTER_PRIVATE_KEY = null // what would this be for mainnet?

  // if local dev, grab priv/pub keys from local ganache chain
  // else, grab key from config
  // NOTE: for local dev, wallet[0] is unlocked and does not require a private key
  if (network === 'development' || network === 'test') {
    const ganacheContractsAccounts = await getDataContractAccounts()
    const keyPairs = ganacheContractsAccounts.private_keys
    BLACKLISTER_PUBLIC_KEY = Object.keys(keyPairs)[0]
    BLACKLISTER_PRIVATE_KEY = keyPairs[BLACKLISTER_PUBLIC_KEY]
  } else {
    BLACKLISTER_PUBLIC_KEY = config.blacklisterAddress
  }
  return { BLACKLISTER_PUBLIC_KEY, BLACKLISTER_PRIVATE_KEY }
}

// init libs with blacklister public address
async function createAndInitLibs(blacklisterPublicKey) {
  let audiusLibs
  try {
    const libsConfig = await initializeLibConfig(blacklisterPublicKey)
    audiusLibs = new AudiusLibs(libsConfig)
    await audiusLibs.init()
  } catch (e) {
    throw new Error(`Error with initializing libs: ${e}`)
  }

  return audiusLibs
}

// add cid to ipld blacklist
async function addIPLDTxToChain(audiusLibs, digest) {
  let ipldTxReceipt
  try {
    ipldTxReceipt = await audiusLibs.contracts.IPLDBlacklistFactoryClient.addIPLDToBlacklist(
      digest
    )
  } catch (e) {
    throw new Error(`Error with adding IPLD blacklist txn: ${e}`)
  }

  return ipldTxReceipt
}

run()
