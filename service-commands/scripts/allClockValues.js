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
async function filterCids(creatorNode, cids) {
  const result = await Promise.all(
    cids.map(
      async cid =>
        await retry(
          () =>
            console.log(creatorNode, cids) ||
            axios({
              method: 'head',
              url: `/ipfs/${cid}`,
              baseURL: creatorNode,
              validateStatus: status => status === 200 || status === 404
            }),
          { retries: 5 }
        )
    )
  )

  console.log('done', creatorNode, cids)

  return cids.filter((_, idx) => result[idx].status === 200)
}
async function run() {
  const discoveryProvider = 'https://discoveryprovider.audius.co/'
  const batchSize = 50

  const tracks = {}
  JSON.parse(fs.readFileSync('tracks.json')).forEach(
    ({ owner_id, metadata_multihash }) => {
      tracks[owner_id] = tracks[owner_id] || []
      tracks[owner_id].push(metadata_multihash)
    }
  )

  const prevBatch = true
  for (let offset = 0; prevBatch; offset += batchSize) {
    console.time(`${offset} - ${offset + batchSize}`)

    const batch = await getUsers(discoveryProvider, offset, batchSize)
    const prevBatch = batch.length !== 0

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

    const data = await Promise.all(
      map(
        batch,
        async ({ user_id, handle, wallet, creator_node_endpoint }) => ({
          user_id,
          handle,
          wallet,
          trackCids: tracks[user_id],
          creatorNodes: await Promise.all(
            creator_node_endpoint.map(async (endpoint, idx) => ({
              endpoint,
              clock: clockValues[endpoint][wallet],
              trackCids: await filterCids(endpoint, tracks[user_id] || []),
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
