
const axios = require('axios')

const MaxPollDurationMs = 30000

async function delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
    let numRequests = 40
    let randomTrackIds = Array.from({ length: numRequests }, () => Math.floor(Math.random() * 10000000));
    console.log(randomTrackIds)
    let start = Date.now()
    let numSuccessfullyProcessed = 0
    await Promise.all(randomTrackIds.map(async (trackId) =>{
        let randomUserId = Math.floor(Math.random() * 10000000)
        console.log(`Logging listen for trackId=${trackId}, userId=${randomUserId}`)
        let success = false
        let signature
        // Issue write operation
        try {
            let data = JSON.stringify({"userId": randomUserId, "solanaListen": true });
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
            console.log(`trackId=${trackId}, userId=${randomUserId} | Processed signature: ${signature} in ${Date.now() - start}ms`)
            numSuccessfullyProcessed += 1
            success = true
        } catch(e) {
            console.log(`Failed writing for trackId=${trackId}, userId=${randomUserId}, ${e}`)
        }
        console.log(`Polling signature ${signature}`)

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
    })
    )
    let end = Date.now()
    let duration = end - start
    console.log(`Processed ${numSuccessfullyProcessed} listens in ${duration}ms`)
}

run()