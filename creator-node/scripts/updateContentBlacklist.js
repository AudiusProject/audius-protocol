const axios = require('axios')
const Web3 = require('web3')
const web3 = new Web3()

const models = require('../src/models')
// const config = require('../src/config')
const { sortKeys, recoverWallet } = require('../src/apiHelpers')

// node updateContentBlacklist.js <action> <type> <id>
// node updateContentBlacklist.js add user 1
// node updateContentBlacklist.js delete track 5

const PUBLIC_KEY = '0x360cfb2148414923aff6f1e2da4223a597ff7901'
const PRIVATE_KEY = '0xf21e444e3cb4482dbb49f3b03ef6bf12f02ffe12448207eee156dc8b023cc34d'
// const PRIVATE_KEY = config.get('delegatePrivateKey')

// Available action types
// TODO: add to config or something
const ACTION_ARR = ['ADD', 'DELETE']
const ACTION_SET = new Set(ACTION_ARR)
const TYPES_ARR = ['USER', 'TRACK']
const TYPES_SET = new Set(TYPES_ARR)

/**
 * Process command line args and either add or delete an entry in/to ContentBlacklist table
 */
async function run () {
  let action, type, id

  // Parse args
  try {
    const args = parseArgs()
    action = args.action
    type = args.type
    id = args.id
  } catch (e) {
    console.error(`\nIncorrect script usage: ${e.message}`)
    console.error(`action: [${ACTION_ARR.toString()}]\ntype: [${TYPES_ARR.toString()}]\nid: [integer of 0 or greater]`)
    console.error(`Script usage: node addToContentBlacklist.js <action> <type> <id>`)
  }

  // Add or remove type and id entry to ContentBlacklist
  try {
    switch (action) {
      case 'ADD': {
        await addToContentBlacklist(type, id)
        break
      }
      case 'DELETE': {
        await removeFromContentBlacklist(type, id)
        break
      }
    }

    console.log(`Successfully performed [${action}] for type [${type}] and id [${id}]`)
  } catch (e) {
    console.error(e)
  } finally {
    // close db connection at end of script
    models.sequelize.close()
  }
}

/**
 * Parses the command line args
 */
function parseArgs () {
  const args = process.argv.slice(2)
  if (args.length !== 3) {
    throw new Error('Too many args provided.')
  }

  const action = args[0].toUpperCase()
  const type = args[1].toUpperCase()
  let id = args[2]
  if (!ACTION_SET.has(action) || !TYPES_SET.has(type) || isNaN(id)) {
    throw new Error(`Improper action (${action}), type (${type}), or id (${id}).`)
  }

  id = parseInt(id)

  return { action, id, type }
}

/**
 * 1. Signs the object {type, id, timestamp} when sorted and stringified
 * 2. Sends axios request to add entry to content blacklist of type and id
 * @param {string} type
 * @param {int} id
 */
async function addToContentBlacklist (type, id) {
  const { timestamp, signature } = generateTimestampAndSignature(type, id)

  let resp
  try {
    resp = await axios({
      // url: `${config.get('creatorNodeEndpoint')}/blacklist/add`,
      url: 'http://localhost:4000/blacklist/add',
      method: 'post',
      params: { type, id, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with adding type [${type}] and id [${id}] to ContentBlacklist: ${e}`)
  }

  return resp.data
}

/**
 * 1. Signs the data with PRIVATE_KEY specified in this script
 * 2. Sends axios request to remove entry from content blacklist of type and id
 * @param {string} type
 * @param {int} id
 */
async function removeFromContentBlacklist (type, id) {
  const { timestamp, signature } = generateTimestampAndSignature(type, id)

  let resp
  try {
    resp = await axios({
      // url: `${config.get('creatorNodeEndpoint')}/blacklist/add`,
      url: 'http://localhost:4000/blacklist/delete',
      method: 'post',
      params: { type, id, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with removing type [${type}] and id [${id}] from ContentBlacklist: ${e}`)
  }

  return resp.data
}

/**
 * Signs the object {type, id, timestamp} when sorted and stringified with the PRIVATE_KEY.
 * Used for authentication in the Creator Node to ensure request to add to/remove from
 * ContentBlacklist is from an authorized user.
 * @param {string} type
 * @param {int} id
 */
function generateTimestampAndSignature (type, id) {
  // Generate data
  const timestamp = new Date().toISOString()
  const toSignObj = { type, id, timestamp }
  // JSON stringify automatically removes white space given 1 param
  const toSignStr = JSON.stringify(sortKeys(toSignObj))

  const toSignHash = web3.utils.keccak256(toSignStr)

  // Generate signature with hashed data and private key
  const signedResponse = web3.eth.accounts.sign(toSignHash, PRIVATE_KEY)

  return { timestamp, signature: signedResponse.signature }
}

run()
