const axios = require('axios')
const { Command } = require('commander')
const program = new Command()
program
  .usage('[action] [type] [ids or cids]')
  .requiredOption('-t, --type <type>', 'user, track, or cid')
  .requiredOption('-l, --list <list>', 'comma separated list of ids or cids', ids => ids.split(','))
  .requiredOption('-a, --act <action>', 'add, remove, or verify')

const { generateTimestampAndSignature } = require('../src/apiSigning')

const PRIVATE_KEY = process.env.delegatePrivateKey // add 0x prefix
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint

// Available action types
const ACTION_ARR = ['ADD', 'REMOVE', 'VERIFY']
const ACTION_SET = new Set(ACTION_ARR)
const TYPES_ARR = ['USER', 'TRACK', 'CID']
const TYPES_SET = new Set(TYPES_ARR)

// Script usage:
// node updateContentBlacklist.js -a add -l 1,3,7 -t user
// node updateContentBlacklist.js -a add -l 1,3,7 -t track
// node updateContentBlacklist.js -a add -l Qm..., Qm..., -t cid

// node updateContentBlacklist.js -a remove -l 1,3,7 -t user
// node updateContentBlacklist.js -a remove -l 1,3,7 -t track
// node updateContentBlacklist.js -a remove -l Qm..., Qm..., -t cid

// node updateContentBlacklist.js -a verify -l 1,3,7 -t user
// node updateContentBlacklist.js -a verify -l 1,3,7 -t track
// node updateContentBlacklist.js -a verify -l Qm..., Qm..., -t cid

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

  try {
    switch (type) {
      case 'USER':
      case 'TRACK':
        switch (action) {
          case 'ADD': {
            await addIdsToContentBlacklist(type, ids)
            break
          }
          case 'REMOVE': {
            await removeIdsFromContentBlacklist(type, ids)
            break
          }
          case 'VERIFY': {
            await verify(type, ids)
            break
          }
        }
        console.log(`Successfully performed [${action}] for type [${type}] and ids [${ids}]`)
        break
      case 'CID':
        switch (action) {
          case 'ADD': {
            await addCIDsToContentBlacklist(cids)
            break
          }
          case 'REMOVE': {
            await removeCIDsFromContentBlacklist(cids)
            break
          }
          case 'VERIFY': {
            await verify(type, cids)
            break
          }
        }
        console.log(`Successfully performed [${action}] for cids [${cids}]`)
        break
      default:
        console.error('Should not have reached here :(')
    }
  } catch (e) {
    console.error(`Failed to perform [${action}] for [${type}]: ${e}`)
  }
}

/**
 * Parses the environment variables and command line args
 */
function parseEnvVarsAndArgs () {
  program.parse(process.argv)

  // Parse env vars
  if (!CREATOR_NODE_ENDPOINT || !PRIVATE_KEY) {
    let errorMsg = `Creator node endpoint [${CREATOR_NODE_ENDPOINT}] or private key [${PRIVATE_KEY}] have not been exported. `
    errorMsg += "\nPlease export environment variables 'delegatePrivateKey' and 'creatorNodeEndpoint'."
    errorMsg += "\nAlso make sure to add the prefix '0x' to the 'delegatePrivateKey'"
    throw new Error(errorMsg)
  }

  // Parse CLI args
  const action = program.act.toUpperCase()
  const type = program.type.toUpperCase()
  if (!ACTION_SET.has(action) || !TYPES_SET.has(type)) {
    throw new Error(`Improper action (${action}) or type (${type}).`)
  }

  // Check if ids or CIDs are passed in
  let list = program.list
  if (!list || list.length === 0) throw new Error('Please pass in a comma separated list of ids and/or cids.')

  let ids = []
  let cids = []
  // Parse ids into ints greater than 0
  if (type === 'USER' || type === 'TRACK') {
    const originalNumIds = list.length
    list = list.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
    if (list.length === 0) throw new Error('List of ids is not proper.')
    if (originalNumIds !== list.length) {
      console.warn(`Filterd out non-numeric ids from input. Please only pass integers!`)
    }
    ids = list
  } else { // else will be CID
    // Parse cids and ensure they follow the pattern Qm...
    const orignalNumCIDs = list.length
    const cidRegex = new RegExp('^Qm[a-zA-Z0-9]{44}$')
    list = list.filter(cid => cidRegex.test(cid))
    if (list.length === 0) throw new Error('List of cids is not proper.')
    if (orignalNumCIDs !== list.length) {
      console.warn(`Filtered out improper cids from input. Please only pass valid CIDs!`)
    }
    cids = list
  }

  return { action, ids, cids, type }
}

/**
 * 1. Signs the data {type, id, timestamp} with PRIVATE_KEY specified in this script
 * 2. Sends axios request to add entry to content blacklist of type and id
 * @param {string} type
 * @param {number[]} ids
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
 * 1. Signs the data {type, id, timestamp} with PRIVATE_KEY specified in this script
 * 2. Sends axios request to remove entry from content blacklist of type and id
 * @param {string} type
 * @param {number[]} ids
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

/**
 * 1. Signs the data {cids, timestamp} with PRIVATE_KEY specified in this script
 * 2. Sends axios request to add cids to content blacklist
 * @param {string[]} cids
 */
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

/**
 * 1. Signs the data {cids, timestamp} with PRIVATE_KEY specified in this script
 * 2. Sends axios request to remove cids from content blacklist
 * @param {string[]} cids
 */
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

/**
 * 1. Get all blacklisted content
 * 2. Iterate through passed in CLI args against fetched content
 * @param {string} type
 * @param {(number[]|string[])} list cids or ids
 */
async function verify (type, list) {
  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist`,
      method: 'get',
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with verifying Content Blacklist content: ${e}`)
  }
  const blacklistedContent = resp.data

  let set
  switch (type) {
    case 'USER':
      set = new Set(blacklistedContent.userIds)
      list = list.map(entry => entry.toString())
      break
    case 'TRACK':
      set = new Set(blacklistedContent.trackIds)
      list = list.map(entry => entry.toString())
      break
    case 'CID':
      set = new Set(blacklistedContent.allSegments)
      break
  }

  const missing = []
  for (let entry of list) {
    if (!set.has(entry)) missing.push(entry)
  }

  if (missing.length > 0) {
    console.error(`Not all ids/cids for type ${type} are blacklisted.`)
    console.log({
      missing,
      input: list
    })
  } else {
    console.log(`All ids/cids for type ${type} are is blacklisted.`)
  }
}

run()
