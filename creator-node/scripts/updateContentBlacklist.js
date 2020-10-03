const models = require('../src/models')
const axios = require('axios')
// const config = require('../src/config')

// node updateContentBlacklist.js <action> <type> <id>
// node updateContentBlacklist.js add user 1
// node updateContentBlacklist.js delete track 5

// Private key
const PRIVATE_KEY = '0x7c973a0dde056c6af857ddd6c441a4557e9c2e6db8aa93b4c50b7d5afdb1bb7b'
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
 * Adds entry to content blacklist of type and id
 * @param {string} type
 * @param {int} id
 */
async function addToContentBlacklist (type, id) {
  // axios request with type and id as query params
  let resp
  try {
    resp = await axios({
      // url: `${config.get('creatorNodeEndpoint')}/blacklist/add`,
      url: 'http://localhost:4000/blacklist/add',
      method: 'post',
      params: { type, id },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with adding type [${type}] and id [${id}] to ContentBlacklist: ${e}`)
  }

  return resp.data
}

/**
 * Removes entry from content blacklist of type and id
 * @param {string} type
 * @param {int} id
 */
async function removeFromContentBlacklist (type, id) {
  // axios req with type and id as query params
  let resp
  try {
    resp = await axios({
      // url: `${config.get('creatorNodeEndpoint')}/blacklist/add`,
      url: 'http://localhost:4000/blacklist/delete',
      method: 'post',
      params: { type, id },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with removing type [${type}] and id [${id}] from ContentBlacklist: ${e}`)
  }

  return resp.data
}

run()
// addToContentBlacklist()
