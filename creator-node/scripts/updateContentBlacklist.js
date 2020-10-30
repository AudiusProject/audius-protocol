const axios = require('axios')
const { Command } = require('commander')
const program = new Command()
program
  .requiredOption('-a, --act <action>', 'add or remove')
  .requiredOption('-t, --type <type>', 'user or track')
  .requiredOption('-l, --list <ids>', 'comma separated list of ids', (value) => value.split(','))

const { generateTimestampAndSignature } = require('../src/apiSigning')

const PRIVATE_KEY = process.env.delegatePrivateKey
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint

// Available action types
const ACTION_ARR = ['ADD', 'REMOVE']
const ACTION_SET = new Set(ACTION_ARR)
const TYPES_ARR = ['USER', 'TRACK']
const TYPES_SET = new Set(TYPES_ARR)

// Script usage:
// node updateContentBlacklist.js -a (action) add/delete -t (type) user/track -l (list) 1 or 1,2
// node updateContentBlacklist.js -a remove -l 1,3,42 -t track
// node updateContentBlacklist.js -a add -l 1 -t user

/**
 * Process command line args and either add or delete an entry in/to ContentBlacklist table
 */
async function run () {
  let args
  try {
    args = parseEnvVarsAndArgs()
  } catch (e) {
    console.error(`\nIncorrect script usage: ${e.message}\n`)
    console.error(`action: [${ACTION_ARR.toString()}]\ntype: [${TYPES_ARR.toString()}]\nid: [list of ints 0 or greater]`)
    return
  }

  const { action, type, ids } = args

  // Add or remove type and id entry to ContentBlacklist
  try {
    switch (action) {
      case 'ADD': {
        await addToContentBlacklist(type, ids)
        break
      }
      case 'DELETE': {
        await removeFromContentBlacklist(type, ids)
        break
      }
    }

    console.log(`Successfully performed [${action}] for type [${type}] and ids [${ids}]`)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Parses the environment variables and command line args
 */
function parseEnvVarsAndArgs () {
  program.parse(process.argv)
  console.log('Your inputs:')
  console.log({ action: program.act, ids: program.list, type: program.type })

  if (!CREATOR_NODE_ENDPOINT || !PRIVATE_KEY) {
    let errorMsg = `Creator node endpoint [${CREATOR_NODE_ENDPOINT}] or private key [${PRIVATE_KEY}] have not been exported. `
    errorMsg += "\nPlease export environment variables 'delegatePrivateKey' and 'creatorNodeEndpoint'."
    throw new Error(errorMsg)
  }

  const action = program.act.toUpperCase()
  const type = program.type.toUpperCase()
  let ids = program.list
  if (!ACTION_SET.has(action) || !TYPES_SET.has(type)) {
    throw new Error(`Improper action (${action}) or type (${type}).`)
  }

  // Parse ids into ints greater than 0
  const numUnfilteredIds = ids.length
  ids = ids.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
  if (ids.length === 0) throw new Error('List of ids is not proper.')
  if (numUnfilteredIds !== ids.length) {
    console.warn(`Filterd out non-numeric ids from input. Please only pass integers!`)
  }

  return { action, ids, type }
}

/**
 * 1. Signs the object {type, id, timestamp} when sorted and stringified
 * 2. Sends axios request to add entry to content blacklist of type and id
 * @param {string} type
 * @param {int} ids
 */
async function addToContentBlacklist (type, ids) {
  const { timestamp, signature } = generateTimestampAndSignature({ type, ids }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/add`,
      method: 'post',
      params: { type, ids, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with adding type [${type}] and id [${ids}] to ContentBlacklist: ${e}`)
  }

  return resp.data
}

/**
 * 1. Signs the data with PRIVATE_KEY specified in this script
 * 2. Sends axios request to remove entry from content blacklist of type and id
 * @param {string} type
 * @param {int} ids
 */
async function removeFromContentBlacklist (type, ids) {
  const { timestamp, signature } = generateTimestampAndSignature({ type, ids }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/delete`,
      method: 'post',
      params: { type, ids, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with removing type [${type}] and ids [${ids}] from ContentBlacklist: ${e}`)
  }

  return resp.data
}

run()
