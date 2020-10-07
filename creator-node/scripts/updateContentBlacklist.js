const axios = require('axios')

const models = require('../src/models')
const config = require('../src/config')
const { generateTimestampAndSignature } = require('../src/apiHelpers')

// const PUBLIC_KEY = config.get('delegateOwnerWallet')
const PRIVATE_KEY = config.get('delegatePrivateKey')
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint

// Available action types
// TODO: add to config or something
const ACTION_ARR = ['ADD', 'DELETE']
const ACTION_SET = new Set(ACTION_ARR)
const TYPES_ARR = models.ContentBlacklist.Types
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
    return
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
  }
}

/**
 * Parses the command line args
 */
function parseArgs () {
  const args = process.argv.slice(2)
  if (args.length !== 3) {
    throw new Error('Incorrect number of args provided.')
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
  const { timestamp, signature } = generateTimestampAndSignature({ type, id }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/add`,
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
  const { timestamp, signature } = generateTimestampAndSignature({ type, id }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/add`,
      method: 'post',
      params: { type, id, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with removing type [${type}] and id [${id}] from ContentBlacklist: ${e}`)
  }

  return resp.data
}

run()
