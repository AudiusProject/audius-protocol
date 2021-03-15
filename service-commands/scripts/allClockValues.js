const fs = require("fs")

const axios = require("axios")
const retry = require("async-retry")
const { map } = require("lodash")

function makeRequest(request) {
  return retry(() => axios(request), { retries: 5 })
}

/**
 * @param {string} discoveryProvider - Discovery Provider endpoint
 * @param {number} offset
 * @param {number} limit
 * @returns {Array<Object>} userBatch
 */
async function getUsersBatch(discoveryProvider, offset, limit) {
  return (
    await makeRequest({
      method: "get",
      url: "/users",
      baseURL: discoveryProvider,
      params: { offset, limit, is_creator: true },
    })
  ).data.data.map((user) => ({
    ...user,
    creator_node_endpoint: user.creator_node_endpoint
      ? user.creator_node_endpoint.split(",").filter((endpoint) => endpoint)
      : [],
  }))
}

/**
 * @param {string} discoveryProvider - Discovery Provider endpoint
 * @param {number} batchSize - Batch Size to use for each request
 * @returns {Object} trackCids - A object mapping user id to a list of track cids
 */
async function getTrackCids(discoveryProvider, batchSize) {
  const trackCids = {}

  let moreTracksRemaining = true
  for (let offset = 0; moreTracksRemaining; offset += batchSize) {
    console.time(`Fetching tracks (${offset} - ${offset + batchSize})`)

    const tracksBatch = (
      await makeRequest({
        method: "get",
        url: "/tracks",
        baseURL: discoveryProvider,
        params: { offset, limit: batchSize },
      })
    ).data.data
    moreTracksRemaining = tracksBatch.length === batchSize

    tracksBatch.forEach(({ metadata_multihash, owner_id }) => {
      trackCids[owner_id] = trackCids[owner_id] || []
      trackCids[owner_id].push(metadata_multihash)
    })

    console.timeEnd(`Fetching tracks (${offset} - ${offset + batchSize})`)
  }

  return trackCids
}

/**
 * @param {string} creatorNode - Creator Node endpoint
 * @param {Array<string>} walletPublicKeys
 * @returns {Array<Object>} clockValues
 */
async function getClockValues(creatorNode, walletPublicKeys) {
  return (
    await makeRequest({
      method: "post",
      url: "/users/batch_clock_status",
      baseURL: creatorNode,
      data: { walletPublicKeys },
    })
  ).data.users
}

/**
 * @param {string} creatorNode - Creator Node endpoint
 * @param {Array<string>} cids
 * @returns {Array<Object>} cidsExist
 */
async function getCidsExist(creatorNode, cids) {
  return (
    await makeRequest({
      method: "post",
      url: "/batch_cids_exist",
      baseURL: creatorNode,
      data: { cids },
    })
  ).data.cids
}

async function run() {
  // const discoveryProvider = "https://discoveryprovider.audius.co/"
  const discoveryProvider = "http://localhost:5000"
  const trackBatchSize = 500
  const userBatchSize = 500

  const trackCids = await getTrackCids(discoveryProvider, trackBatchSize)

  let moreUsersRemaining = true
  for (let offset = 0; moreUsersRemaining; offset += userBatchSize) {
    console.time(`${offset} - ${offset + userBatchSize}`)

    const usersBatch = await getUsersBatch(
      discoveryProvider,
      offset,
      userBatchSize
    )
    moreUsersRemaining = usersBatch.length === userBatchSize

    const creatorNodes = new Set()
    const cn2wallets = {} // creator node -> wallets
    const cn2cids = {} // creator node -> cids
    const cids = {} // user id -> cids
    usersBatch.forEach(
      ({
        creator_node_endpoint,
        user_id,
        wallet,
        cover_photo_sizes,
        profile_picture_sizes,
        metadata_multihash,
      }) => {
        cids[user_id] = Array.from(trackCids[user_id] || [])
        cids[user_id].push(cover_photo_sizes)
        cids[user_id].push(profile_picture_sizes)
        cids[user_id].push(metadata_multihash)

        creator_node_endpoint.forEach((endpoint) => {
          creatorNodes.add(endpoint)
          cn2wallets[endpoint] = cn2wallets[endpoint] || []
          cn2wallets[endpoint].push(wallet)
          cn2cids[endpoint] = cn2cids[endpoint] || []
          cn2cids[endpoint].push(...cids[user_id])
        })
      }
    )

    const clockValues = {} // creator node -> wallet -> clock value
    const cidExists = {} // creator node -> cid -> exists
    await Promise.all(
      Array.from(creatorNodes).map(async (creatorNode) => {
        const [clockValuesArr, cidExistsArr] = await Promise.all([
          getClockValues(creatorNode, cn2wallets[creatorNode]),
          getCidsExist(creatorNode, cn2cids[creatorNode]),
        ])

        clockValues[creatorNode] = {}
        clockValuesArr.forEach(({ walletPublicKey, clock }) => {
          clockValues[creatorNode][walletPublicKey] = clock
        })

        cidExists[creatorNode] = {}
        cidExistsArr.forEach(({ cid, exists }) => {
          cidExists[creatorNode][cid] = exists
        })
      })
    )

    const output = usersBatch.map(
      ({ user_id, handle, wallet, creator_node_endpoint }) => ({
        user_id,
        handle,
        wallet,
        cids: cids[user_id],
        creatorNodes: creator_node_endpoint.map((endpoint, idx) => ({
          endpoint,
          clock: clockValues[endpoint][wallet],
          cids: cids[user_id].filter((cid) => cidExists[endpoint][cid]),
          primary: idx === 0,
        })),
      })
    )

    fs.writeFileSync(`output.${offset}.json`, JSON.stringify(output, null, 4))

    console.timeEnd(`${offset} - ${offset + userBatchSize}`)
  }
}

run()
