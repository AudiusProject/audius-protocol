const Web3 = require('web3')

const initAudiusLibs = require('../examples/initAudiusLibs')
const { distributeTokens } = require('./helpers/distributeTokens')
const { setServiceVersion } = require('./helpers/version')
const { registerLocalServices, queryLocalServices } = require('./helpers/spRegistration')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const spDiscProvType = serviceTypeList[0]
const spCreatorNodeType = serviceTypeList[1]
const discProvEndpoint1 = 'http://docker.for.mac.localhost:5000'
const creatorNodeEndpoint1 = 'http://docker.for.mac.localhost:4000'
const creatorNodeEndpoint2 = 'http://docker.for.mac.localhost:4010'
const testVersionStr = '0.1.0'
const ethWeb3ProviderUrl = 'http://localhost:8545/'

async function run() {
  try{
    let audiusLibs = await initAudiusLibs(true)
    // await distributeTokens(audiusLibs)
    // await setServiceVersion(audiusLibs, spDiscProvType, testVersionStr)
    // await setServiceVersion(audiusLibs, spCreatorNodeType, testVersionStr)
    await registerLocalServices(audiusLibs, spDiscProvType, discProvEndpoint1)
    await registerLocalServices(audiusLibs, spCreatorNodeType, creatorNodeEndpoint1)
    // await queryLocalServices(audiusLibs)
  
    process.exit(0)
  }
  catch(e){
    console.error(e)
    process.exit(1)
  }
}

run()
