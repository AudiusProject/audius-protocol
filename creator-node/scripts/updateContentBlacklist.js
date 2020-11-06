const axios = require('axios')
const { Command } = require('commander')
const program = new Command()
program
  .usage('[action] [type] [ids or cids]')
  .requiredOption('-a, --act <action>', 'add or remove')
  .requiredOption('-t, --type <type>', 'user or track')
  .option('-i, --ids <ids>', 'comma separated list of ids', ids => ids.split(','))
  .option('-c, --cids <cids>', 'comma separated list of cids', cids => cids.split(','))

const { generateTimestampAndSignature } = require('../src/apiSigning')

const PRIVATE_KEY = process.env.delegatePrivateKey // add 0x prefix
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint

// Available action types
const ACTION_ARR = ['ADD', 'REMOVE']
const ACTION_SET = new Set(ACTION_ARR)
const TYPES_ARR = ['USER', 'TRACK', 'CID']
const TYPES_SET = new Set(TYPES_ARR)

// Script usage:
// note: the same action applies to both cids and ids if both are passed in
// node updateContentBlacklist.js -a (action) add/remove -t (type) user/track -i (ids) 1 or 1,2,... -c (cids) Qm... or Qm...1,Qm...2,...
// node updateContentBlacklist.js -a remove -i 1,3,42 -t track
// node updateContentBlacklist.js -a add -i 1 -t user
// node updateContentBlacklist.js -a remove -i 1,3,42 -t track -c Qm...

// For help:
// node updateContentBlacklist.js --help

/**
 * Process command line args and either add or remove an entry in/to ContentBlacklist table
 */
async function run () {
  let args
  try {
    args = parseEnvVarsAndArgs()
  } catch (e) {
    console.error(`\nIncorrect script usage: ${e.message}\n`)
    console.error(`action: [${ACTION_ARR.toString()}]\ntype: [${TYPES_ARR.toString()}]\nids: [list of ints 0 or greater]\ncids: [list of cids]`)
    return
  }

  const { action, type, ids, cids } = args

  if (ids) {
    // Add or remove type and id entry to ContentBlacklist
    try {
      switch (action) {
        case 'ADD': {
          await addIdsToContentBlacklist(type, ids)
          break
        }
        case 'REMOVE': {
          await removeIdsFromContentBlacklist(type, ids)
          break
        }
      }

      console.log(`Successfully performed [${action}] for type [${type}] and ids [${ids}]`)
    } catch (e) {
      console.error(e)
    }
  }

  if (cids) {
    try {
      switch (action) {
        case 'ADD': {
          await addCIDsToContentBlacklist(cids)
          break
        }

        case 'REMOVE': {
          await removeCIDsFromContentBlacklist(cids)
          break
        }
      }
      console.log(`Successfully performed [${action}] for cids [${cids}]`)
    } catch (e) {
      console.error(e)
    }
  }
}

/**
 * Parses the environment variables and command line args
 */
function parseEnvVarsAndArgs () {
  program.parse(process.argv)
  console.log('Your inputs:')
  console.log({ action: program.act, ids: program.ids, cids: program.cids, type: program.type })

  // Parse env vars
  if (!CREATOR_NODE_ENDPOINT || !PRIVATE_KEY) {
    let errorMsg = `Creator node endpoint [${CREATOR_NODE_ENDPOINT}] or private key [${PRIVATE_KEY}] have not been exported. `
    errorMsg += "\nPlease export environment variables 'delegatePrivateKey' and 'creatorNodeEndpoint'."
    throw new Error(errorMsg)
  }

  // Parse CLI args
  const action = program.act.toUpperCase()
  const type = program.type.toUpperCase()
  if (!ACTION_SET.has(action) || !TYPES_SET.has(type)) {
    throw new Error(`Improper action (${action}) or type (${type}).`)
  }

  // Check if ids or CIDs are passed in
  // TODO: there's probably a built in commander api to handle passing in one or the other args
  let ids = program.ids
  let cids = program.cids
  if ((!ids || ids.length === 0) && (!cids || cids.length === 0)) throw new Error('Please pass in a comma separated list of ids and/or cids.')

  // Parse ids into ints greater than 0
  if (ids) {
    const originalNumIds = ids.length
    ids = ids.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
    if (ids.length === 0) throw new Error('List of ids is not proper.')
    if (originalNumIds !== ids.length) {
      console.warn(`Filterd out non-numeric ids from input. Please only pass integers!`)
    }
  }

  // Parse cids and ensure they follow the pattern Qm...
  if (cids) {
    const orignalNumCIDs = cids.length
    const cidRegex = new RegExp('^Qm[a-zA-Z0-9]{44}$')
    cids = cids.filter(cid => cidRegex.test(cid))
    if (cids.length === 0) throw new Error('List of cids is not proper.')
    if (orignalNumCIDs !== cids.length) {
      console.warn(`Filtered out improper cids from input. Please only pass valid CIDs!`)
    }
  }

  return { action, ids, cids, type }
}

/**
 * 1. Signs the object {type, id, timestamp} when sorted and stringified
 * 2. Sends axios request to add entry to content blacklist of type and id
 * @param {string} type
 * @param {[number]} ids
 */
async function addIdsToContentBlacklist (type, ids) {
  const { timestamp, signature } = generateTimestampAndSignature({ type, ids }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/add/ids`,
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
 * @param {[number]} ids
 */
async function removeIdsFromContentBlacklist (type, ids) {
  const { timestamp, signature } = generateTimestampAndSignature({ type, ids }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/remove/ids`,
      method: 'post',
      params: { type, ids, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with removing type [${type}] and ids [${ids}] from ContentBlacklist: ${e}`)
  }

  return resp.data
}

async function addCIDsToContentBlacklist (cids) {
  const { timestamp, signature } = generateTimestampAndSignature({ cids }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/add/cids`,
      method: 'post',
      params: { cids, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with adding cids [${cids.toString()}] from ContentBlacklist: ${e}`)
  }

  return resp.data
}

async function removeCIDsFromContentBlacklist (cids) {
  const { timestamp, signature } = generateTimestampAndSignature({ cids }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/remove/cids`,
      method: 'post',
      params: { cids, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with removing cids [${cids.toString()}] from ContentBlacklist: ${e}`)
  }

  return resp.data
}

run()
