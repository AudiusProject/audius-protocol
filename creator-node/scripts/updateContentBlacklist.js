const axios = require('axios')
const { Command } = require('commander')
const program = new Command()
program
  .usage('-a [action] -t [type] -l [ids or cids] -v [verbose (optional)]')
  .requiredOption('-t, --type <type>', 'user, track, or cid')
  .requiredOption('-l, --list <list>', 'comma separated list of ids or cids', ids => ids.split(','))
  .requiredOption('-a, --act <action>', 'add, remove, or verify')
  .option('-v, --verbose', 'boolean to print out blacklisted/unblacklisted segments')

const { generateTimestampAndSignature } = require('../src/apiSigning')

const PRIVATE_KEY = process.env.delegatePrivateKey
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint
const DISCOVERY_PROVIDER_ENDPOINT = process.env.discoveryProviderEndpoint

// Available action types
const ACTION_ARR = ['ADD', 'REMOVE']
const ACTION_SET = new Set(ACTION_ARR)
const TYPES_ARR = ['USER', 'TRACK', 'CID']
const TYPES_SET = new Set(TYPES_ARR)

const REQUEST_CONCURRENCY_LIMIT = 20
const MAX_LIMIT = 500

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

// add -v flag to each script run to see the segments and number of segments touched

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

  console.log('Updating Content Blacklist...\n')
  const { action, type, values, verbose } = args
  try {
    switch (action) {
      case 'ADD': {
        await addToContentBlacklist(type, values)
        break
      }
      case 'REMOVE': {
        await removeFromContentBlacklist(type, values)
        break
      }
      default: {
        console.error('Should not have reached here :(')
        return
      }
    }
  } catch (e) {
    console.error(`Failed to perform [${action}] for [${type}]: ${e}`)
    return
  }

  console.log('Verifying content against blacklist...\n')
  try {
    const segments = await verifyWithBlacklist({ type, values, action })

    let successMsg = `Successfully performed [${action}] for type [${type}]!\nValues: [${values}]`
    if (verbose) {
      successMsg += `\nNumber of Segments: ${segments.length}`
      successMsg += `\nSegments: ${segments}`
    }
    console.log(successMsg)
  } catch (e) {
    console.error(`Verification check failed: ${e}`)
  }
}

/**
 * Parses the environment variables and command line args
 */
function parseEnvVarsAndArgs () {
  program.parse(process.argv)

  // Parse env vars
  if (!CREATOR_NODE_ENDPOINT || !PRIVATE_KEY || !DISCOVERY_PROVIDER_ENDPOINT) {
    let errorMsg = `Creator node endpoint [${CREATOR_NODE_ENDPOINT}], private key [${PRIVATE_KEY}]`
    errorMsg += ` or discovery provider endpoint [${DISCOVERY_PROVIDER_ENDPOINT}] have not been exported.`
    throw new Error(errorMsg)
  }

  // Parse CLI args
  const action = program.act.toUpperCase()
  const type = program.type.toUpperCase()
  if (!ACTION_SET.has(action) || !TYPES_SET.has(type)) {
    throw new Error(`Improper action (${action}) or type (${type}).`)
  }

  // Check if ids or CIDs are passed in
  let values = program.list
  if (!values || values.length === 0) throw new Error('Please pass in a comma separated list of ids and/or cids.')

  // Parse ids into ints greater than 0
  if (type === 'USER' || type === 'TRACK') {
    const originalNumIds = values.length
    values = values.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
    if (values.length === 0) throw new Error('List of ids is not proper.')
    if (originalNumIds !== values.length) {
      console.warn(`Filterd out non-numeric ids from input. Please only pass integers!`)
    }
  } else { // else will be CID
    // Parse cids and ensure they follow the pattern Qm...
    const orignalNumCIDs = values.length
    const cidRegex = new RegExp('^Qm[a-zA-Z0-9]{44}$')
    values = values.filter(cid => cidRegex.test(cid))
    if (values.length === 0) throw new Error('List of cids is not proper.')
    if (orignalNumCIDs !== values.length) {
      console.warn(`Filtered out improper cids from input. Please only pass valid CIDs!`)
    }
  }

  return { action, values, type, verbose: program.verbose }
}

/**
 * 1. Signs the data {type, values, timestamp} with PRIVATE_KEY specified in this script
 * 2. Sends axios request to add entry to content blacklist of type and values
 * @param {string} type
 * @param {number[]|string[]} values
 */
async function addToContentBlacklist (type, values) {
  const { timestamp, signature } = generateTimestampAndSignature({ type, values }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/add`,
      method: 'post',
      params: { type, values, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with adding type [${type}] and values [${values}] to ContentBlacklist: ${e}`)
  }

  return resp.data
}

/**
 * 1. Signs the data {type, values, timestamp} with PRIVATE_KEY specified in this script
 * 2. Sends axios request to remove entry from content blacklist of type and id
 * @param {string} type
 * @param {number[]|string[]} values
 */
async function removeFromContentBlacklist (type, values) {
  const { timestamp, signature } = generateTimestampAndSignature({ type, values }, PRIVATE_KEY)

  let resp
  try {
    resp = await axios({
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/remove`,
      method: 'post',
      params: { type, values, timestamp, signature },
      responseType: 'json'
    })
  } catch (e) {
    throw new Error(`Error with removing type [${type}] and values [${values}] from ContentBlacklist: ${e}`)
  }

  return resp.data
}

/**
 * 1. Get all blacklisted content
 * 2. Iterate through passed in CLI args against fetched content
 * @param {string} type
 * @param {(number[]|string[])} values cids or ids
 * @returns {string[]} all segments associated with input
 */
async function verifyWithBlacklist ({ type, values, action }) {
  let allSegments = await getSegments(type, values)

  // Hit creator node /ipfs/:CID route to see if segment is blacklisted
  let checkFn, filterFn
  switch (action) {
    case 'ADD':
      checkFn = checkIsBlacklisted
      filterFn = status => !status
      break
    case 'REMOVE':
      checkFn = checkIsNotBlacklisted
      filterFn = status => status
      break
  }

  // Batch requests
  let creatorNodeResponses = []
  const checkSegmentBlacklistStatusRequests = allSegments.map(segment => checkFn(segment))
  for (let i = 0; i < allSegments.length; i += REQUEST_CONCURRENCY_LIMIT) {
    const creatorNodeResponsesSlice = await Promise.all(checkSegmentBlacklistStatusRequests.slice(i, i + REQUEST_CONCURRENCY_LIMIT))
    creatorNodeResponses = creatorNodeResponses.concat(creatorNodeResponsesSlice)
  }

  // Segments that were not accounted for during blacklisting/unblacklisting
  const unaccountedSegments = creatorNodeResponses
    .filter(resp => filterFn(resp.blacklisted))
    .map(resp => resp.segment)

  if (unaccountedSegments.length > 0) {
    let errorMsg = `Some segments from [${type}] and values [${values}] were not blacklisted/unblacklisted.`
    errorMsg += `\nNumber of Segments: ${unaccountedSegments.length}`
    errorMsg += `\nSegments: [${unaccountedSegments.toString()}]`
    throw new Error(errorMsg)
  }

  return allSegments
}

async function getSegments (type, values) {
  if (type === 'CID') return values

  let discProvRequests
  let allSegments
  try {
    // Fetch all the segments via disc prov
    switch (type) {
      case 'USER': {
        const map = await fetchUserToNumTracksMap(values)
        const additionalRequests = []
        discProvRequests = values
          .map(value => {
            let numTracksForUser = map[value]
            const axiosRequest = {
              url: `${DISCOVERY_PROVIDER_ENDPOINT}/tracks`,
              method: 'get',
              params: { user_id: value, limit: MAX_LIMIT },
              responseType: 'json'
            }

            if (numTracksForUser > MAX_LIMIT) {
            // If users have over 500 tracks, add additional requests to query those tracks
              let offset = 0
              while (numTracksForUser > MAX_LIMIT) {
                const axiosRequestWithOffset = { ...axiosRequest }
                axiosRequestWithOffset.params.offset = offset
                additionalRequests.push(axios(axiosRequest))

                offset += MAX_LIMIT
                numTracksForUser -= MAX_LIMIT
              }
              return null
            } else {
              // Else, create one request
              return axios(axiosRequest)
            }
          })
          // Filter out null resps from users with over 500 tracks
          .filter(Boolean)

        discProvRequests.concat(additionalRequests)
        break
      }
      case 'TRACK': {
        discProvRequests = values.map(value => axios({
          url: `${DISCOVERY_PROVIDER_ENDPOINT}/tracks`,
          method: 'get',
          params: { id: value },
          responseType: 'json'
        }))
        break
      }
    }

    // Batch requests
    let discProvResps = []
    for (let i = 0; i < discProvRequests.length; i += REQUEST_CONCURRENCY_LIMIT) {
      const discProvResponsesSlice = await Promise.all(discProvRequests.slice(i, i + REQUEST_CONCURRENCY_LIMIT))
      discProvResps = discProvResps.concat(discProvResponsesSlice)
    }

    // Iterate through disc prov responses and grab all the track segments
    allSegments = discProvResps
      .map(resp => resp.data.data[0])
      .map(track => track.track_segments)[0]
      .map(segment => segment.multihash)
  } catch (e) {
    throw new Error(`Error with fetching segments for verifcation: ${e}`)
  }
  return allSegments
}

/**
 * Fetches the total tracks count from all input userIds, and returns a map of user_id:track_count
 * @param {number[]} userIds
 */
async function fetchUserToNumTracksMap (userIds) {
  const resps = await axios({
    url: `${DISCOVERY_PROVIDER_ENDPOINT}/users`,
    method: 'get',
    params: { user_id: userIds },
    responseType: 'json'
  })

  const map = {}
  resps.map(resp => {
    map[resp.user_id] = resp.track_count
  })
  return map
}

/**
 * Check if segment is blacklisted via /ipfs/:CID route
 * @param {string} segment
 */
async function checkIsBlacklisted (segment) {
  try {
    await axios.head(`${CREATOR_NODE_ENDPOINT}/ipfs/${segment}`)
  } catch (e) {
    if (e.response && e.response.status && e.response.status === 403) {
      return { segment, blacklisted: true }
    }
    console.error(`Failed to check for segment [${segment}]: ${e}`)
  }
  return { segment, blacklisted: false }
}

/**
 * Check if segment is not blacklisted via /ipfs/:CID route
 * @param {string} segment
 */
async function checkIsNotBlacklisted (segment) {
  try {
    await axios.head(`${CREATOR_NODE_ENDPOINT}/ipfs/${segment}`)
  } catch (e) {
    console.error(`Failed to check for segment [${segment}]: ${e}`)
    return { segment, blacklisted: true }
  }
  return { segment, blacklisted: false }
}

run()
