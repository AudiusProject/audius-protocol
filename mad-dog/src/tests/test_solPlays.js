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

async function submitTrackListen(executeOne, trackId, userId, solanaListen = true) {
    let success = false
    let signature
    let start = Date.now()

    // Issue write operation
    try {
        await executeOne(DEFAULT_INDEX, async (libs)=> {
            let identityResp = await libs.logTrackListen(trackId, userId, null, null, true)
            signature = identityResp.solTxSignature
            console.log(`${Date.now()} trackId=${trackId}, userId=${userId} | Processed signature: ${signature} in ${Date.now() - start}ms`)
            numSuccessfullyProcessed += 1
            success = true
        })
    } catch(e) {
        console.log(`Failed writing for trackId=${trackId}, userId=${userId}, ${e}`)
    }

    if (solanaListen && signature) {
        console.log(`${Date.now()} trackId=${trackId}, userId=${userId} | Polling signature ${signature}`)
        // Poll discovery to confirm write into Plays table
        let pollStart = Date.now()
        let requestConfig = {
            method: 'get',
            url: `http://localhost:5000/get_sol_play?tx_sig=${signature}`
        }
        let resp = (await axios(requestConfig)).data
        while (!resp.data) {
            await delay(500)
            resp = (await axios(requestConfig)).data
            if (Date.now() - pollStart > MaxPollDurationMs) {
                throw new Error(`Failed to find ${signature} for userId=${userId}, trackId=${trackId} in ${MaxPollDurationMs}ms`)
            }
        }
        let discoveryResp = resp.data
        if (discoveryResp.signature === signature &&
            discoveryResp.play_item_id === trackId &&
            discoveryResp.user_id === userId
        ) {
            console.log(`Found ${signature} in discovery node after ${Date.now() - pollStart}ms | ${JSON.stringify(discoveryResp)}`)
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
    let numTracks = 350
    let randomTrackIds = Array.from({ length: numTracks }, () => Math.floor(Math.random() * 10000000));
    await Promise.all(
        randomTrackIds.map(async (trackId) => {
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
        })
    )
    let end = Date.now()
    let duration = end - start
    console.log(`Processed ${numSuccessfullyProcessed} listens in ${duration}ms`)
    if (numSuccessfullyProcessed < numTracks) {
        throw new Error('Failed to process 1 listen per track')
    }
}

module.exports = {
    solanaTrackListenCountsTest
}