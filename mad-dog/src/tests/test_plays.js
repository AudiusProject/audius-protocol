const axios = require('axios')

const MaxPollDurationMs = 240000

async function delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

let numSuccessfullyProcessed = 0

const DEFAULT_INDEX = 0

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

async function getTotalPlays() {
    return (await axios({
        method: 'get',
        url: `http://localhost:5000/v1/metrics/plays?bucket_size=century`
    })).data.data[0].count
}

async function submitTrackListen(executeOne, trackId, userId) {
    let success = false
    let start = Date.now()
    let totalPlays = await getTotalPlays()

    // Issue write operation
    try {
        await executeOne(DEFAULT_INDEX, async (libs) => {
            await libs.logTrackListen(trackId, userId, null, null, false)
            console.log(`${Date.now()} trackId=${trackId}, userId=${userId} | Processed in ${Date.now() - start}ms`)
            numSuccessfullyProcessed += 1
            success = true
        })
    } catch(e) {
        console.log(`Failed writing for trackId=${trackId}, userId=${userId}, ${e}`)
    }

    if (success) {
        console.log(`${Date.now()} trackId=${trackId}, userId=${userId} | Polling`)
        // Poll discovery to confirm write into Plays table
        let pollStart = Date.now()
        let resp = await getTotalPlays()
        while (resp == totalPlays) {
            await delay(500)
            resp = await getTotalPlays()
            if (Date.now() - pollStart > MaxPollDurationMs) {
                throw new Error(`Failed to find play for userId=${userId}, trackId=${trackId} in ${MaxPollDurationMs}ms`)
            }
        }
        if (resp === totalPlays + 1) {
            console.log(`Found play in discovery node after ${Date.now() - pollStart}ms`)
        }
    }
}

// Integration test that sends plays through identity
// Validates each play is indexed by discovery provider
async function trackListenCountsTest({
    numUsers,
    executeAll,
    executeOne,
}) {
    let start = Date.now()
    let numTracks = 350
    let randomTrackIds = Array.from({ length: numTracks }, () => Math.floor(Math.random() * 10000000));

    for (trackId of randomTrackIds) {
        // Record between 1 and 5 listens for each track
        let numListens = randomNumber(2, 5)
        let randomUserId = Math.floor(Math.random() * 10000000)
        console.log(`Logging ${numListens} listens for trackId=${trackId}, userId=${randomUserId}`)
        while (numListens > 0) {
            await submitTrackListen(
                executeOne,
                trackId,
                randomUserId
            )
            numListens--
        }
    }
    let end = Date.now()
    let duration = end - start
    console.log(`Processed ${numSuccessfullyProcessed} listens in ${duration}ms`)
}

module.exports = {
    trackListenCountsTest
}
