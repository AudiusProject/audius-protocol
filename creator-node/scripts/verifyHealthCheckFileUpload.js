const axios = require('axios')
const FormData = require('form-data')
const { generateTimestampAndSignature } = require('../src/apiSigning')
const { promisify } = require('util')

const crypto = require('crypto')

const PRIVATE_KEY = process.env.delegatePrivateKey
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint
const randomBytes = promisify(crypto.randomBytes)

/**
 * Process command line args and issue file upload health check
 */
async function run () {
  try {
    parseEnvVarsAndArgs()
  } catch (e) {
    console.error(`\nIncorrect script usage: ${e.message}`)
    console.error(`Script usage: node verifyHealthCheckFileUpload.js`)
    return
  }

  try {
    // Generate signature using local key
    const randomBytesToSign = (await randomBytes(18)).toString()
    const signedLocalData = generateTimestampAndSignature({ randomBytesToSign }, PRIVATE_KEY)
    // Add randomBytes to outgoing request parameters
    const reqParam = signedLocalData
    reqParam.randomBytes = randomBytesToSign

    let sampleTrack = new FormData()
    sampleTrack.append('file', (await axios({
      method: 'get',
      url: 'https://s3-us-west-1.amazonaws.com/download.audius.co/sp-health-check-files/97mb_music.mp3', // 97 MB
      responseType: 'stream'
    })).data)

    let requestConfig = {
      headers: {
        ...sampleTrack.getHeaders()
      },
      url: `${CREATOR_NODE_ENDPOINT}/health_check/fileupload`,
      method: 'post',
      params: reqParam,
      responseType: 'json',
      data: sampleTrack,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }
    let resp = await axios(requestConfig)
    let data = resp.data
    console.dir(data, { depth: 5 })
  } catch (e) {
    console.error(e)
  }
}

/**
 * Parses the environment variables and command line args
 * export creatorNodeEndpoint=http://cn1_creator-node_1:4000
 * export delegatePrivateKey=f0b743ce8adb7938f1212f188347a63...
 * NOTE: DO NOT PREFIX PRIVATE KEY WITH 0x
 */
function parseEnvVarsAndArgs () {
  if (!CREATOR_NODE_ENDPOINT || !PRIVATE_KEY) {
    let errorMsg = `creatorNodeEndpoint [${CREATOR_NODE_ENDPOINT}] or delegatePrivateKey [${PRIVATE_KEY}] have not been exported. `
    errorMsg += "Please export environment variables 'delegatePrivateKey' and 'creatorNodeEndpoint'."
    throw new Error(errorMsg)
  }
}

run()
