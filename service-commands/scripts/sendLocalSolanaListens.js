
const axios = require('axios')

async function run() {
    let numRequests = 5
    let randomTrackIds = Array.from({ length: numRequests }, () => Math.floor(Math.random() * 40));
    console.log(randomTrackIds)
    await randomTrackIds.forEach(async(trackId)=>{
        let randomUserId = Math.floor(Math.random() * 40)
        console.log(`Logging listen for trackId=${trackId}, userId=${randomUserId}`)
        let data = JSON.stringify({"userId": randomUserId });
        let requestConfig = {
            method: 'post',
            url: `http://localhost:7000/tracks/${trackId}/listen`,
            headers: {
              'Content-Type': 'application/json'
            },
            data : data
        }
        await axios(requestConfig)
    })
}

run()