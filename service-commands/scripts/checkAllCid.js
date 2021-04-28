const fs = require('fs')
const http = require('http')
const https = require('https')

const axios = require('axios')
const retry = require('async-retry')

axios.defaults.timeout = 10000
axios.defaults.httpAgent = new http.Agent({ timeout: 10000 })
axios.defaults.httpsAgent = new https.Agent({ timeout: 10000 })

const cidsExistsSupported = {}
const imageCidsExistsSupported = {}

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeRequest (request) {
  return retry(() => axios(request), { retries: 10 })
}

/**
 * @param {string} discoveryProvider - Discovery Provider endpoint
 * @param {number} offset
 * @param {number} limit
 * @returns {Array<Object>} userBatch
 */
async function getUsersBatch (discoveryProvider, offset, limit) {
  return (
    await makeRequest({
      method: 'get',
      url: '/users',
      baseURL: discoveryProvider,
      params: { offset, limit }
    })
  ).data.data.map(user => ({
    ...user,
    creator_node_endpoint: user.creator_node_endpoint
      ? user.creator_node_endpoint.split(',').filter(endpoint => endpoint)
      : []
  }))
}

/**
 * @param {string} discoveryProvider - Discovery Provider endpoint
 * @param {number} batchSize - Batch Size to use for each request
 * @returns {Object} trackCids - A object mapping user id to a list of track cids
 */
async function getTrackCids (discoveryProvider, batchSize) {
  const trackCids = {}

  const totalTracks = (
    await makeRequest({
      method: 'get',
      url: '/latest/track',
      baseURL: discoveryProvider
    })
  ).data.data

  console.log(`Fetching tracks (total of ${totalTracks})`)

  for (let offset = 0; offset < totalTracks; offset += batchSize) {
    console.time(`Fetching tracks (${offset} - ${offset + batchSize})`)

    const tracksBatch = (
      await makeRequest({
        method: 'get',
        url: '/tracks',
        baseURL: discoveryProvider,
        params: { offset, limit: batchSize }
      })
    ).data.data

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
async function getClockValues (creatorNode, walletPublicKeys) {
  try {
    return (
      await makeRequest({
        method: 'post',
        url: '/users/batch_clock_status',
        baseURL: creatorNode,
        data: { walletPublicKeys }
      })
    ).data.data.users
  } catch (e) {
    console.log(`Got ${e} when fetching clock values from ${creatorNode}`)
    return walletPublicKeys.map(walletPublicKey => ({
      walletPublicKey,
      clock: 0
    }))
  }
}

/**
 * @param {string} creatorNode - Creator Node endpoint
 * @param {Array<string>} cids
 * @returns {Array<Object>} cidsExist
 */
async function getCidsExist (creatorNode, cids, batchSize = 500) {
  try {
    if (cidsExistsSupported[creatorNode] === undefined) {
      cidsExistsSupported[creatorNode] =
        (
          await makeRequest({
            method: 'post',
            url: '/batch_cids_exist',
            baseURL: creatorNode,
            data: { cids: [] },
            validateStatus: (status) => status === 200 || status === 404
          })
        ).status === 200

      if (cidsExistsSupported[creatorNode]) {
        await sleep(5000)
      }
    }

    if (!cidsExistsSupported[creatorNode]) {
      throw new Error('creator node out of date')
    }

    const cidsExist = []

    for (let offset = 0; offset < cids.length; offset += batchSize) {
      const batch = cids.slice(offset, offset + batchSize)
      cidsExist.push(
        ...(
          await makeRequest({
            method: 'post',
            url: '/batch_cids_exist',
            baseURL: creatorNode,
            data: { cids: batch }
          })
        ).data.data.cids
      )

      await sleep(5000)
    }

    return cidsExist
  } catch (e) {
    console.log(`Got ${e} when checking if cids exist in ${creatorNode}`)
    return cids.map(cid => ({ cid, exists: false }))
  }
}

/**
 * @param {string} creatorNode - Creator Node endpoint
 * @param {Array<string>} cids
 * @returns {Array<Object>} cidsExist
 */
async function getImageCidsExist (creatorNode, cids, batchSize = 500) {
  try {
    if (imageCidsExistsSupported[creatorNode] === undefined) {
      imageCidsExistsSupported[creatorNode] =
        (
          await makeRequest({
            method: 'post',
            url: '/batch_image_cids_exist',
            baseURL: creatorNode,
            data: { cids: [] },
            validateStatus: (status) => status === 200 || status === 404
          })
        ).status === 200

      if (imageCidsExistsSupported[creatorNode]) {
        await sleep(5000)
      }
    }

    if (!imageCidsExistsSupported[creatorNode]) {
      throw new Error('creator node out of date')
    }

    const cidsExist = []

    for (let offset = 0; offset < cids.length; offset += batchSize) {
      const batch = cids.slice(offset, offset + batchSize)
      cidsExist.push(
        ...(
          await makeRequest({
            method: 'post',
            url: '/batch_image_cids_exist',
            baseURL: creatorNode,
            data: { cids: batch }
          })
        ).data.data.cids
      )

      await sleep(5000)
    }

    return cidsExist
  } catch (e) {
    console.log(`Got ${e} when checking if cids exist in ${creatorNode}`)
    return cids.map(cid => ({ cid, exists: false }))
  }
}

async function run () {
  const discoveryProvider = 'https://discoveryprovider.audius.co/'
  // const discoveryProvider = "https://discoveryprovider.staging.audius.co/"
  // const discoveryProvider = 'http://localhost:5000'
  const trackBatchSize = 500
  const userBatchSize = 500

  const trackCids = await getTrackCids(discoveryProvider, trackBatchSize)
  fs.writeFileSync('trackCids.json', JSON.stringify(trackCids, null, 4))
  // const trackCids = require('./trackCids.json')

  const totalUsers = (
    await makeRequest({
      method: 'get',
      url: '/latest/user',
      baseURL: discoveryProvider
    })
  ).data.data

  console.log(`Total Users: ${totalUsers}`)

  for (let offset = 0; offset < totalUsers; offset += userBatchSize) {
    console.time(`${offset} - ${offset + userBatchSize}`)

    const usersBatch = await getUsersBatch(
      discoveryProvider,
      offset,
      userBatchSize
    )

    const creatorNodes = new Set()
    const creatorNodeWalletMap = {} // map of creator node to wallets
    const creatorNodeCidMap = {} // map of creator node to cids
    const creatorNodeImageCidMap = {} // map of creator node to image cids
    const cids = {} // map of user id to cids
    usersBatch.forEach(
      ({
        creator_node_endpoint,
        user_id,
        wallet,
        cover_photo_sizes,
        profile_picture_sizes,
        metadata_multihash
      }) => {
        cids[user_id] = Array.from(trackCids[user_id] || [])
        if (metadata_multihash) {
          cids[user_id].push(metadata_multihash)
        }

        creator_node_endpoint.forEach(endpoint => {
          creatorNodes.add(endpoint)
          creatorNodeWalletMap[endpoint] = creatorNodeWalletMap[endpoint] || []
          creatorNodeWalletMap[endpoint].push(wallet)
          creatorNodeCidMap[endpoint] = creatorNodeCidMap[endpoint] || []
          creatorNodeCidMap[endpoint].push(...cids[user_id])

          creatorNodeImageCidMap[endpoint] =
            creatorNodeImageCidMap[endpoint] || []
          if (cover_photo_sizes) {
            creatorNodeImageCidMap[endpoint].push(cover_photo_sizes)
          }
          if (profile_picture_sizes) {
            creatorNodeImageCidMap[endpoint].push(profile_picture_sizes)
          }
        })
      }
    )

    const clockValues = {} // creator node -> wallet -> clock value
    const cidExists = {} // creator node -> cid -> exists
    const imageCidExists = {} // creator node -> image cid -> exists
    await Promise.all(
      Array.from(creatorNodes).map(async creatorNode => {
        const [
          clockValuesArr,
          cidExistsArr,
          imageCidExistsArr
        ] = await Promise.all([
          getClockValues(creatorNode, creatorNodeWalletMap[creatorNode]),
          getCidsExist(creatorNode, creatorNodeCidMap[creatorNode]),
          getImageCidsExist(creatorNode, creatorNodeImageCidMap[creatorNode])
        ])

        clockValues[creatorNode] = {}
        clockValuesArr.forEach(({ walletPublicKey, clock }) => {
          clockValues[creatorNode][walletPublicKey] = clock
        })

        cidExists[creatorNode] = {}
        cidExistsArr.forEach(({ cid, exists }) => {
          cidExists[creatorNode][cid] = exists
        })

        imageCidExists[creatorNode] = {}
        imageCidExistsArr.forEach(({ cid, exists }) => {
          imageCidExists[creatorNode][cid] = exists
        })
      })
    )

    const output = usersBatch.map(
      ({
        user_id,
        handle,
        wallet,
        creator_node_endpoint,
        cover_photo_sizes,
        profile_picture_sizes,
        metadata_multihash
      }) => ({
        user_id,
        handle,
        wallet,
        metadata_multihash,
        cover_photo: cover_photo_sizes,
        profile_picture: profile_picture_sizes,
        cids: cids[user_id],
        creatorNodes: creator_node_endpoint.map((endpoint, idx) => ({
          endpoint,
          metadata_multihash: metadata_multihash
            ? cidExists[endpoint][metadata_multihash]
            : null,
          cover_photo: cover_photo_sizes
            ? imageCidExists[endpoint][cover_photo_sizes]
            : null,
          profile_picture: profile_picture_sizes
            ? imageCidExists[endpoint][profile_picture_sizes]
            : null,
          clock: clockValues[endpoint][wallet],
          cids: cids[user_id].filter(cid => cidExists[endpoint][cid]),
          primary: idx === 0
        }))
      })
    )

    fs.writeFileSync(`output.${offset}.json`, JSON.stringify(output, null, 4))

    console.timeEnd(`${offset} - ${offset + userBatchSize}`)
  }
}

run()
