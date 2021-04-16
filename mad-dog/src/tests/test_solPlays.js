const axios = require('axios')

const MaxPollDurationMs = 30000

async function delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

let numSuccessfullyProcessed = 0

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

async function submitTrackListen(trackId, userId, solanaListen = true) {
    let success = false
    let signature
    let start = Date.now()
    // Issue write operation
    try {
        let data = JSON.stringify({"userId": userId, "solanaListen": solanaListen });
        let requestConfig = {
            method: 'post',
            url: `http://localhost:7000/tracks/${trackId}/listen`,
            headers: {
                'Content-Type': 'application/json'
            },
            data : data
        }
        let resp = (await axios(requestConfig)).data
        signature = resp.solTxSignature
        console.log(`trackId=${trackId}, userId=${userId} | Processed signature: ${signature} in ${Date.now() - start}ms`)
        numSuccessfullyProcessed += 1
        success = true
    } catch(e) {
        console.log(`Failed writing for trackId=${trackId}, userId=${userId}, ${e}`)
    }
    console.log(`Polling signature for trackId=${trackId}, userId=${userId}, ${signature}`)

    if (solanaListen) {
        // Poll discovery to confirm write into Plays table
        let pollStart = Date.now()
        let requestConfig = {
            method: 'get',
            url: `http://localhost:5000/get_sol_play?tx_sig=${signature}`
        }
        let resp = (await axios(requestConfig)).data
        while (resp.data.length === 0) {
            await delay(500)
            resp = (await axios(requestConfig)).data
            if (Date.now() - pollStart > MaxPollDurationMs) {
                throw new Error(`Failed to find ${signature} in ${MaxPollDurationMs}ms`)
            }
        }
        if (resp.data[0].signature === signature) {
            console.log(`Found ${signature} in discovery node after ${Date.now() - pollStart}ms | ${JSON.stringify(resp.data[0])}`)
        }
    }
}

// Integration test that sends plays through identity to Solana deployment
// Validates each transaction is indexed by discovery provider
async function solanaTrackListenCountsTest({
    numUsers,
    executeAll,
    executeOne,
}) {
    let start = Date.now()
    let numTracks = 5
    let randomTrackIds = Array.from({ length: numTracks }, () => Math.floor(Math.random() * 10000000));
    await Promise.all(
        randomTrackIds.map(async (trackId) => {
            // Record between 1 and 5 listens for each track
            let numListens = randomNumber(1, 5)
            let randomUserId = Math.floor(Math.random() * 10000000)
            console.log(`Logging ${numListens} listens for trackId=${trackId}, userId=${randomUserId}`)
            while (numListens > 0) {
                await submitTrackListen(trackId, randomUserId)
                numListens--
            }
        })
    )
    let end = Date.now()
    let duration = end - start
    console.log(`Processed ${numSuccessfullyProcessed} listens in ${duration}ms`)
}

module.exports = {
    solanaTrackListenCountsTest
}