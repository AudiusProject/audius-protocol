
const axios = require('axios')

async function run() {
    let numRequests = 20
    let randomTrackIds = Array.from({ length: numRequests }, () => Math.floor(Math.random() * 10000000));
    console.log(randomTrackIds)
    let start = Date.now()
    let numSuccessfullyProcessed = 0
    await Promise.all(randomTrackIds.map(async (trackId) =>{
        try {
            let randomUserId = Math.floor(Math.random() * 10000000)
            console.log(`Logging listen for trackId=${trackId}, userId=${randomUserId}`)
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
            let signature = resp.solTxSignature
            console.log(`trackId=${trackId}, userId=${randomUserId} | Processed signature: ${signature}`)
            numSuccessfullyProcessed += 1
        } catch(e) {
            console.log(`Failed writing for trackId=${trackId}, userId=${randomUserId}, ${e}`)
        }
    })
    )
    let end = Date.now()
    let duration = end - start
    console.log(`Processed ${numSuccessfullyProcessed} listens in ${duration}ms`)
}

run()