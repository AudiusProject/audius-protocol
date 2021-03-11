const fs = require('fs')

const { map } = require('lodash')
const axios = require('axios')
const retry = require('async-retry')
async function getUsers(discoveryProvider, offset, limit) {
  return (
    await retry(
      () =>
        axios({
          method: 'get',
          url: '/users',
          baseURL: discoveryProvider,
          params: { offset, limit, is_creator: true }
        }),
      { retries: 5 }
    )
  ).data.data.map(user => ({
    ...user,
    creator_node_endpoint: user.creator_node_endpoint
      ? user.creator_node_endpoint.split(',').filter(endpoint => endpoint)
      : []
  }))
}
async function getTracks(discoveryProvider, batchSize = 500) {
  const tracks = []

  let prevBatch = true
  for (let offset = 0; prevBatch; offset += batchSize) {
    console.time(`Fetching tracks (${offset} - ${offset + batchSize})`)

    const batch = (
      await retry(
        () =>
          axios({
            method: 'get',
            url: '/tracks',
            baseURL: discoveryProvider,
            params: { offset, limit: batchSize }
          }),
        { retries: 5 }
      )
    ).data.data.map(({ metadata_multihash, owner_id }) => ({
      metadata_multihash,
      owner_id
    }))
    prevBatch = batch.length === batchSize
    tracks.push(...batch)

    console.timeEnd(`Fetching tracks (${offset} - ${offset + batchSize})`)
  }

  return tracks
}
async function getClockValues(creatorNode, walletPublicKeys) {
  return (
    await retry(
      () =>
        axios({
          method: 'post',
          url: '/users/batch_clock_status',
          baseURL: creatorNode,
          data: { walletPublicKeys }
        }),
      { retries: 5 }
    )
  ).data.users
}
async function getCidsExist(creatorNode, cids) {
  return (
    await retry(
      () =>
        axios({
          method: 'post',
          url: '/batch_cids_exist',
          baseURL: creatorNode,
          data: { cids }
        }),
      { retries: 5 }
    )
  ).data.cids
}
async function run() {
  //  const discoveryProvider = 'https://discoveryprovider.audius.co/'
  const discoveryProvider = 'http://localhost:5000/'
  const batchSize = 50

  const tracks = {}
  ;(await getTracks(discoveryProvider)).forEach(
    ({ owner_id, metadata_multihash }) => {
      tracks[owner_id] = tracks[owner_id] || []
      tracks[owner_id].push(metadata_multihash)
    }
  )

  let prevBatch = true
  for (let offset = 0; prevBatch; offset += batchSize) {
    console.time(`${offset} - ${offset + batchSize}`)

    const batch = await getUsers(discoveryProvider, offset, batchSize)
    prevBatch = batch.length !== 0

    const wallets = {}
    batch.forEach(({ creator_node_endpoint, wallet }) => {
      creator_node_endpoint.forEach(endpoint => {
        wallets[endpoint] = wallets[endpoint] || []
        wallets[endpoint].push(wallet)
      })
    })

    const clockValues = {}
    await Promise.all(
      map(wallets, async (walletPublicKeys, creatorNode) => {
        clockValues[creatorNode] = {}
        ;(await getClockValues(creatorNode, walletPublicKeys)).forEach(
          ({ walletPublicKey, clock }) => {
            clockValues[creatorNode][walletPublicKey] = clock
          }
        )
      })
    )

    const trackCids = {}
    batch.forEach(({ creator_node_endpoint, user_id }) => {
      creator_node_endpoint.forEach(endpoint => {
        trackCids[endpoint] = trackCids[endpoint] || []
        trackCids[endpoint].push(...tracks[user_id])
      })
    })

    const trackCidExists = {}
    await Promise.all(
      map(trackCids, async (batchTrackCids, creatorNode) => {
        trackCidExists[creatorNode] = {}
        ;(await getCidsExist(creatorNode, batchTrackCids)).forEach(
          ({ cid, exists }) => {
            trackCidExists[creatorNode][cid] = exists
          }
        )
      })
    )

    const data = await Promise.all(
      map(
        batch,
        async ({ user_id, handle, wallet, creator_node_endpoint }) => ({
          user_id,
          handle,
          wallet,
          trackCids: tracks[user_id] || [],
          creatorNodes: await Promise.all(
            creator_node_endpoint.map(async (endpoint, idx) => ({
              endpoint,
              clock: clockValues[endpoint][wallet],
              trackCids: (tracks[user_id] || []).filter(
                cid => trackCidExists[endpoint][cid]
              ),
              primary: idx === 0
            }))
          )
        })
      )
    )

    fs.writeFileSync(`data.${offset}.json`, JSON.stringify(data, null, 4))

    console.timeEnd(`${offset} - ${offset + batchSize}`)
  }

  process.exit(0)
}
run()
