
const axios = require('axios')


async function run() {
    let numRequests = 1

    let randomTrackIds = Array.from({ length: 2 }, () => Math.floor(Math.random() * 40));
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

/*
var axios = require('axios');
var data = JSON.stringify({"userId":1});

var config = {
  method: 'post',
  url: 'http://3.101.117.237:7000/tracks/133/listen',
  headers: { 
    'Content-Type': 'application/json'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

*/