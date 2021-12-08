const axios = require('axios')
const { Command } = require('commander')
const Hashids = require('hashids/cjs')

const { generateTimestampAndSignature } = require('../src/apiSigning')

const PRIVATE_KEY = process.env.delegatePrivateKey
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint
const DISCOVERY_PROVIDER_ENDPOINT = process.env.discoveryProviderEndpoint

// Available action types
const ACTION_ARR = ['ADD', 'REMOVE']
const ACTION_SET = new Set(ACTION_ARR)
const TYPES_ARR = ['USER', 'TRACK', 'CID', 'TRACK_HASH_ID']
const TYPES_SET = new Set(TYPES_ARR)

const REQUEST_CONCURRENCY_LIMIT = 20
const MAX_LIMIT = 500
const VALUES_BATCH_SIZE = 10

let VERBOSE = false
const COMMANDER_HELP_STRING =
`-a [action] -t [type] -l [ids or cids] -v [verbose (optional)]

// Example usage:
// node delistContent.js -a add -l 1,3,7 -t user
// node delistContent.js -a add -l 1,3,7 -t track
// node delistContent.js -a add -l 7eP5n,ML51L -t track-hash-id
// node delistContent.js -a add -l Qm..., Qm..., -t cid

// node delistContent.js -a remove -l 1,3,7 -t user
// node delistContent.js -a remove -l 1,3,7 -t track
// node delistContent.js -a remove -l 7eP5n,ML51L -t track-hash-id
// node delistContent.js -a remove -l Qm..., Qm..., -t cid
`

class Commander {
  constructor () {
    this.program = new Command()
    this.program
      .usage(COMMANDER_HELP_STRING)
      .requiredOption('-t, --type <type>', `Type of id - either 'track', 'track-hash-id', 'user' or 'cid'.\n'track-hash-id' is an encoded version of a track id commonly found in URLs with this pattern 'https://contentnode.domain.com/tracks/stream/7eP5n'. In this case the 'track-hash-id' is '7eP5n'.`)
      .requiredOption('-l, --list <list>', 'comma separated list of ids or cids', ids => ids.split(','))
      .requiredOption('-a, --act <action>', '`add` to set of delisted content or `remove` from set of delisted content')
      .option('-v, --verbose', 'verbose mode to print out debug logs', VERBOSE)
      .exitOverride(err => {
        if (err.code === 'commander.missingMandatoryOptionValue') this.program.help()
      })
  }

  /**
 * Parses the environment variables and command line args
 */
  parseEnvVarsAndArgs () {
    this.program.parse(process.argv)
    const hashIds = new HashIds()

    // Parse env vars
    if (!CREATOR_NODE_ENDPOINT || !PRIVATE_KEY || !DISCOVERY_PROVIDER_ENDPOINT) {
      let errorMsg = `Creator node endpoint [${CREATOR_NODE_ENDPOINT}], private key [${PRIVATE_KEY}]`
      errorMsg += ` or discovery provider endpoint [${DISCOVERY_PROVIDER_ENDPOINT}] have not been exported.`
      throw new Error(errorMsg)
    }

    // Parse CLI args
    const action = this.program.act.toUpperCase()
    // this is a let because TRACK_HASH_ID switches to type TRACK once the ids have been decoded
    let type = this.program.type.toUpperCase().replace(/-/g, '_')

    if (!ACTION_SET.has(action) || !TYPES_SET.has(type)) {
      throw new Error(`Improper action (${action}) for type (${type}).`)
    }

    // Check if ids or CIDs are passed in
    let values = this.program.list
    if (!values || values.length === 0) throw new Error('Please pass in a comma separated list of ids and/or cids.')

    // Parse ids into ints greater than 0
    if (type === 'USER' || type === 'TRACK') {
      const originalNumIds = values.length
      values = values.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
      if (values.length === 0) throw new Error('List of ids is not proper.')
      if (originalNumIds !== values.length) {
        console.warn(`Filtered out non-numeric ids from input. Please only pass integers!`)
      }
    } else if (type === 'TRACK_HASH_ID') {
      const originalNumIds = values.length
      values = values.map(value => {
        const decodedId = hashIds.decode(value)
        if (decodedId) return decodedId
      }).filter(Boolean)
      type = 'TRACK'
      if (values.length === 0) throw new Error('List of track hash ids is not proper.')
      if (originalNumIds !== values.length) {
        console.warn(`Filtered out invalid ids from input. Please only valid track hash ids!`)
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

    if (this.program.verbose) VERBOSE = this.program.verbose
    return { action, values, type, verbose: this.program.verbose }
  }
}

class Logger {
  static debug (...msgs) {
    if (VERBOSE) console.log(...msgs)
  }

  static info (...msgs) {
    console.log(...msgs)
  }

  static error (...msgs) {
    console.error(...msgs)
  }
}
class HashIds {
  constructor () {
    this.HASH_SALT = 'azowernasdfoia'
    this.MIN_LENGTH = 5
    this.hashids = new Hashids(this.HASH_SALT, this.MIN_LENGTH)
  }
  encode (id) {
    return this.hashids.encode([id])
  }

  decode (id) {
    const ids = this.hashids.decode(id)
    if (!ids.length) return null
    return ids[0]
  }
}

/**
 * Process command line args and either add or remove an entry in/to ContentBlacklist table
 */
async function run () {
  let args
  try {
    const commander = new Commander()
    args = commander.parseEnvVarsAndArgs()
    console.log(args)
    return
  } catch (e) {
    Logger.error(`
      Incorrect script usage: ${e.message}
      - action: [${ACTION_ARR.toString()}]
      - type: [${TYPES_ARR.toString()}]
      - ids: [list of ids (or cids for CID type)]
    `)
  }

  const { action, type, values, verbose } = args
  Logger.info(`Updating Content Blacklist for ${CREATOR_NODE_ENDPOINT} for values: [${values}]`)

  for (let i = 0; i < values.length; i += VALUES_BATCH_SIZE) {
    const valuesSliced = values.slice(i, i + VALUES_BATCH_SIZE)
    try {
      switch (action) {
        case 'ADD': {
          await addToContentBlacklist(type, valuesSliced)
          break
        }
        case 'REMOVE': {
          await removeFromContentBlacklist(type, valuesSliced)
          break
        }
        default: {
          Logger.error('Invalid action, please choose either `add` and `remove`')
          return
        }
      }
    } catch (e) {
      Logger.error(`Failed to perform [${action}] for [${type}]: ${e}`)
      return
    }

    Logger.info(`Verifying content against blacklist for ${CREATOR_NODE_ENDPOINT}...\n`)
    try {
      const segments = await verifyWithBlacklist({ type, values: valuesSliced, action })

      let successMsg =
      `
        Successfully performed [${action}] for type [${type}]!
        Values: [${valuesSliced}]
      `
      if (verbose) {
        successMsg +=
        `
        Number of Segments: ${segments.length}
        Segments: ${segments}
        `
      }
      Logger.info(successMsg)
    } catch (e) {
      Logger.error(`Verification check failed: ${e}`)
    }
  }
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
    const reqObj = {
      url: `${CREATOR_NODE_ENDPOINT}/blacklist/add`,
      method: 'post',
      params: { type, values, timestamp, signature },
      responseType: 'json'
    }
    Logger.debug(`About to send axios request to ${reqObj.url} for values`, values)
    resp = await axios(reqObj)
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

  if (type === 'TRACK') {

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
          // Filter out null resps from mapping requests with users with over 500 tracks
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
    let allSegmentObjs = []
    for (const resp of discProvResps) {
      for (const track of resp.data.data) {
        allSegmentObjs = allSegmentObjs.concat(track.track_segments)
      }
    }
    allSegments = allSegmentObjs.map(segmentObj => segmentObj.multihash)
  } catch (e) {
    throw new Error(`Error with fetching segments for verification: ${e}`)
  }
  return allSegments
}

/**
 * Fetches the total tracks count from all input userIds, and returns a map of user_id:track_count
 * @param {number[]} userIds
 */
async function fetchUserToNumTracksMap (userIds) {
  const resp = await axios({
    url: `${DISCOVERY_PROVIDER_ENDPOINT}/users`,
    method: 'get',
    params: { id: userIds },
    responseType: 'json'
  })

  const map = {}
  resp.data.data.map(resp => {
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

    // CID was not found on node, would not have been served either way, return success
    if (e.response.status === 404) return { segment, blacklisted: true }

    Logger.error(`Failed to check for segment [${segment}]: ${e}`)
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
    Logger.error(`Failed to check for segment [${segment}]: ${e}`)
    return { segment, blacklisted: true }
  }
  return { segment, blacklisted: false }
}

run()
