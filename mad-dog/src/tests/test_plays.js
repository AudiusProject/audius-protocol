const axios = require('axios')
const { delay } = require('../helpers.js')

const MaxPollDurationMs = 240000

async function logTrackListen(trackId, userId, solanaListen) {
  return (await axios({
    method: 'post',
    url: `http://localhost:7000/tracks/${trackId}/listen`,
    data: {
      userId,
      solanaListen,
    }
  })).data
}

async function getSolPlay (signature) {
  return (await axios({
    method: 'get',
    url: `http://localhost:5000/get_sol_play?tx_sig=${signature}`
  }))
}

async function getTotalPlays () {
  return ((await axios({
    method: 'get',
    // use nonce to bypass cache
    url: `http://localhost:5000/v1/metrics/plays?bucket_size=century&nonce=${Math.random()}`
  })).data.data[0] || {}).count || 0
}

async function submitTrackListen (executeOne, trackId, userId, solanaListen) {
  const initialPlays = getTotalPlays()

  let signature
  try {
    await executeOne(0, async (libs) => {
      const start = Date.now()
      const identityResponse = await logTrackListen(trackId, userId, solanaListen)
      signature = identityResponse.solTxSignature
      console.log(`Logged track listen (trackId=${trackId}, userId=${userId}, solanaListen=${solanaListen}) | Processed in ${Date.now() - start}ms`)
    })
  } catch (err) {
    console.log(`Failed to log track listen (trackId=${trackId}, userId=${userId}, solanaListen=${solanaListen}) with error ${err}`)
    return false
  }

  const pollStart = Date.now()
  console.log(`Polling track listen (trackId=${trackId}, userId=${userId}, solanaListen=${solanaListen})`)

  if (solanaListen) {
    let resp = (await getSolPlay(signature)).data
    while (!resp.data) {
      await delay(500)
      resp = (await getSolPlay(signature)).data
      if (Date.now() - pollStart > MaxPollDurationMs) {
        throw new Error(`Failed to find ${signature} for userId=${userId}, trackId=${trackId} in ${MaxPollDurationMs}ms`)
      }
    }
  } else {
    let plays = await getTotalPlays()
    while (plays === initialPlays) {
      await delay(500)
      plays = await getTotalPlays()
      if (Date.now() - pollStart > MaxPollDurationMs) {
        throw new Error(`Failed to find listen for userId=${userId}, trackId=${trackId} in ${MaxPollDurationMs}ms`)
      }
    }
  }

  console.log(`Found track listen (trackId=${trackId}, userId=${userId}, solanaListen=${solanaListen}) in discovery-provider`)

  return true
}

async function trackListenCountsTest ({ executeOne }) {
  const numBaseTracks = 10
  const numAnonBaseTracks = 10
  const numSolanaTracks = 300
  const numAnonSolanaTracks = 50

  const start = Date.now()

  const numSuccessfulSolanaTrackListens = (await Promise.all(
    Array.from({ length: numSolanaTracks }, async () => {
      const numListens = Math.floor(Math.random() * 5) + 1
      const trackId = Math.floor(Math.random() * 10000000)
      const userId = Math.floor(Math.random() * 10000000)

      return (await Promise.all(
        Array.from({ length: numListens }, () =>
          submitTrackListen(executeOne, trackId, userId, true)
        )
      )).reduce((a, b) => a + b, 0)
    })
  )).reduce((a, b) => a + b, 0)

  const numSuccessfulAnonSolanaTrackListens = (await Promise.all(
    Array.from({ length: numAnonSolanaTracks }, async () => {
      const numListens = Math.floor(Math.random() * 5) + 1
      const trackId = Math.floor(Math.random() * 10000000)
      const userId = `anon-${Math.floor(Math.random() * 10000000)}`

      return (await Promise.all(
        Array.from({ length: numListens }, () =>
          submitTrackListen(executeOne, trackId, userId, true)
        )
      )).reduce((a, b) => a + b, 0)
    })
  )).reduce((a, b) => a + b, 0)

  let numSuccessfulBaseTrackListens = 0
  for (let i = 0; i < numBaseTracks; i++) {
    const numListens = Math.floor(Math.random() * 5) + 1
    const trackId = Math.floor(Math.random() * 10000000)
    const userId = Math.floor(Math.random() * 10000000)

    for (let j = 0; j < numListens; j++) {
      if (await submitTrackListen(executeOne, trackId, userId, false)) {
        numSuccessfulBaseTrackListens += 1
      }
    }
  }

  let numSuccessfulAnonBaseTrackListens = 0
  for (let i = 0; i < numAnonBaseTracks; i++) {
    const numListens = Math.floor(Math.random() * 5) + 1
    const trackId = Math.floor(Math.random() * 10000000)
    const userId = `anon-${Math.floor(Math.random() * 10000000)}`

    for (let j = 0; j < numListens; j++) {
      if (await submitTrackListen(executeOne, trackId, userId, false)) {
        numSuccessfulAnonBaseTrackListens += 1
      }
    }
  }

  const totalSuccessfullyProcessed = numSuccessfulSolanaTrackListens +
    numSuccessfulAnonSolanaTrackListens +
    numSuccessfulBaseTrackListens +
    numSuccessfulAnonBaseTrackListens

  console.log(
    `Processed ${totalSuccessfullyProcessed} (` +
    `solana: ${numSuccessfulSolanaTrackListens}, ` +
    `solana anon: ${numSuccessfulAnonSolanaTrackListens}, ` +
    `base: ${numSuccessfulBaseTrackListens}, ` +
    `base anon: ${numSuccessfulAnonBaseTrackListens}` +
    `) in ${Date.now() - start}ms`
  )
}

module.exports = {
  trackListenCountsTest 
}
