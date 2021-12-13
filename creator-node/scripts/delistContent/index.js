const axios = require('axios')
const HashIds = require('./hashIds')
const Commander = require('./commanderHelper')
const { generateTimestampAndSignature } = require('./apiSigning')

// required env variables
const PRIVATE_KEY = process.env.delegatePrivateKey
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint
const DISCOVERY_PROVIDER_ENDPOINT = process.env.discoveryProviderEndpoint

const REQUEST_CONCURRENCY_LIMIT = 20
const MAX_LIMIT = 500
const VALUES_BATCH_SIZE = 10

// this is a global flag that will be modified to true if verbose mode flag enabled by caller
let VERBOSE_MODE = false

// create a global instance of HashIds
const hashIds = new HashIds()

// simple logger to wrap console to control debug logging behavior
const Logger = {
  debug: (...msgs) => { if (VERBOSE_MODE) console.log(...msgs) },
  info: (...msgs) => { console.log(...msgs) },
  error: (...msgs) => { console.error('Error: ', ...msgs) }
}

/**
 * Process command line args and either add or remove an entry in/to ContentBlacklist table
 */
async function run () {
  let args
  const commander = new Commander()
  args = commander.runParser({ CREATOR_NODE_ENDPOINT, PRIVATE_KEY, DISCOVERY_PROVIDER_ENDPOINT, hashIds })

  const { action, type, values, verbose } = args
  if (verbose) VERBOSE_MODE = true
  Logger.info(`Updating Content Blacklist for ${CREATOR_NODE_ENDPOINT} for values: [${values}]...`)

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
          throw new Error(`Invalid action type: ${action}`)
        }
      }
    } catch (e) {
      Logger.error(`Failed to perform [${action}] for [${type}]: ${e}`)
      return
    }

    Logger.debug(`Verifying content against blacklist for ${CREATOR_NODE_ENDPOINT}...\n`)
    try {
      const segments = await verifyWithBlacklist({ type, values: valuesSliced, action })

      Logger.info(`Successfully performed [${action}] for type [${type}]! Values: [${valuesSliced}]`)
      Logger.debug(`Number of Segments: ${segments.length}
Segments: ${segments}`)
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
      checkFn = checkIsSegmentBlacklisted
      filterFn = status => !status
      break
    case 'REMOVE':
      checkFn = checkIsSegmentNotBlacklisted
      filterFn = status => status
      break
  }

  // Batch requests
  let creatorNodeCIDResponses = []
  const checkCIDDelistStatusRequests = allSegments.map(segment => checkFn(segment))
  for (let i = 0; i < allSegments.length; i += REQUEST_CONCURRENCY_LIMIT) {
    const creatorNodeCIDResponsesSlice = await Promise.all(checkCIDDelistStatusRequests.slice(i, i + REQUEST_CONCURRENCY_LIMIT))
    creatorNodeCIDResponses = creatorNodeCIDResponses.concat(creatorNodeCIDResponsesSlice)
  }

  // Segments that were not accounted for during blacklisting/unblacklisting
  const unaccountedSegments = creatorNodeCIDResponses
    .filter(resp => filterFn(resp.blacklisted))
    .map(resp => resp.value)

  if (unaccountedSegments.length > 0) {
    let errorMsg = `Some segments from [${type}] and values [${values}] were not blacklisted/unblacklisted.`
    errorMsg += `\nNumber of Segments: ${unaccountedSegments.length}`
    errorMsg += `\nSegments: [${unaccountedSegments.toString()}]`
    throw new Error(errorMsg)
  }

  // If the type is TRACK, we also need to check the stream route
  if (type === 'TRACK') {
    // Batch requests
    let creatorNodeTrackResponses = []
    const checkTrackDelistStatusRequests = values.map(trackId => checkIsTrackBlacklisted(trackId))
    for (let i = 0; i < values.length; i += REQUEST_CONCURRENCY_LIMIT) {
      const creatorNodeTrackResponsesSlice = await Promise.all(checkTrackDelistStatusRequests.slice(i, i + REQUEST_CONCURRENCY_LIMIT))
      creatorNodeTrackResponses = creatorNodeTrackResponses.concat(creatorNodeTrackResponsesSlice)
    }

    // Segments that were not accounted for during blacklisting/unblacklisting
    const unaccountedTracks = creatorNodeTrackResponses
      .filter(resp => filterFn(resp.blacklisted))
      .map(resp => resp.value)

    Logger.debug('creatorNodeTrackResponses', creatorNodeTrackResponses)
    if (unaccountedTracks.length > 0) {
      let errorMsg = `Tracks with ids [${values}] were not delisted/undelisted.`
      errorMsg += `\nNumber of Tracks: ${unaccountedTracks.length}`
      errorMsg += `\nSegments: [${unaccountedTracks.toString()}]`
      throw new Error(errorMsg)
    }
  }

  return allSegments
}

/**
 * For resources of a valid type, get all the segments for the passed in id values
 * @param {String} type 'USER' or 'TRACK'
 * @param {(number[])} values ids for associated type
 * @returns
 */
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
async function checkIsSegmentBlacklisted (segment) {
  try {
    await axios.head(`${CREATOR_NODE_ENDPOINT}/ipfs/${segment}`)
  } catch (e) {
    if (e.response && e.response.status && e.response.status === 403) {
      return { segment, blacklisted: true }
    }

    // CID was not found on node, would not have been served either way, return success
    if (e.response.status === 404) return { type: 'CID', value: segment, blacklisted: true }

    Logger.error(`Failed to check for segment [${segment}]: ${e}`)
  }
  return { type: 'CID', value: segment, blacklisted: false }
}

async function checkIsTrackBlacklisted (id) {
  try {
    const encodedId = hashIds.encode(id)
    await axios.head(`${CREATOR_NODE_ENDPOINT}/track/stream/${encodedId}`)
  } catch (e) {
    if (e.response && e.response.status && e.response.status === 403) {
      return { value: id, blacklisted: true }
    }

    // CID was not found on node, would not have been served either way, return success
    if (e.response.status === 404) return { type: 'TRACK', value: id, blacklisted: true }

    Logger.error(`Failed to check for track [${id}]: ${e}`)
  }
  return { type: 'TRACK', value: id, blacklisted: false }
}

/**
 * Check if segment is not blacklisted via /ipfs/:CID route
 * @param {string} segment
 */
async function checkIsSegmentNotBlacklisted (segment) {
  try {
    await axios.head(`${CREATOR_NODE_ENDPOINT}/ipfs/${segment}`)
  } catch (e) {
    Logger.error(`Failed to check for segment [${segment}]: ${e}`)
    return { segment, blacklisted: true }
  }
  return { segment, blacklisted: false }
}

run()
