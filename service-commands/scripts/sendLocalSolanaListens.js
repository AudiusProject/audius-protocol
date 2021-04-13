
const axios = require('axios')

async function run() {
    let numRequests = 1
    let randomTrackIds = Array.from({ length: numRequests }, () => Math.floor(Math.random() * 40));
    console.log(randomTrackIds)
    await randomTrackIds.forEach(async(trackId)=>{
        let randomUserId = Math.floor(Math.random() * 40)
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
        console.log(`Processed signature: ${signature}`)
    })
}

run()