const axios = require('axios')
// const { generateTimestampAndSignature } = require('../src/apiSigning')
const Web3 = require('web3')
const web3 = new Web3()
const { sortKeys } = require('../src/apiSigning')
const { promisify } = require('util')

const crypto = require('crypto')

const PRIVATE_KEY = process.env.delegatePrivateKey
const CREATOR_NODE_ENDPOINT = process.env.creatorNodeEndpoint
const randomBytes = promisify(crypto.randomBytes)

/**
 * Process command line args and either add or delete an entry in/to ContentBlacklist table
 */
async function run () {
  let args
  try {
    parseEnvVarsAndArgs()
  } catch (e) {
    console.error(`\nIncorrect script usage: ${e.message}`)
    console.error(`Script usage: node verifyHealthcheckDuration.js`)
    return
  }
  // const { action, type, id } = args
  // Add or remove type and id entry to ContentBlacklist
  try {
    console.log(`Generating request parameters`)
    console.log(`Generating timestamp...`)
    const timestamp = new Date().toISOString()
    console.log(`${timestamp}`)
    console.log(`Generating random bytes...`)
    const randomBytesToSign = await randomBytes(18)
    console.log(`Generated: ${randomBytesToSign}`)
    const toSignObj = {
     timestamp, randomBytesToSign
    }

    console.log(toSignObj)
    const toSignStr = JSON.stringify(sortKeys(toSignObj))
    const toSignHash = web3.utils.keccak256(toSignStr)
    const privateKey = PRIVATE_KEY

    const signedResponse = web3.eth.accounts.sign(toSignHash, privateKey)
    console.log(signedResponse)

    const signedResponseSignature = signedResponse.signature
    console.log(signedResponseSignature)

    let requestParams = {
      url: `${CREATOR_NODE_ENDPOINT}/health_check/duration`,
      method: 'get',
      params: { timestamp, randomBytes: randomBytesToSign, signedResponseSignature },
      responseType: 'json'
    }

    let resp = await axios(requestParams)
    console.dir(resp, { depth: 5 })
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
