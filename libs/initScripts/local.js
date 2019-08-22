const initAudiusLibs = require('../examples/initAudiusLibs')
const { distributeTokens } = require('./helpers/distributeTokens')
const { setServiceVersion } = require('./helpers/version')
const { registerLocalService, queryLocalServices } = require('./helpers/spRegistration')
// const { deregisterLocalService } = require('./helpers/spRegistration')
// const { getClaimInfo, fundNewClaim } = require('./helpers/claim')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const spDiscProvType = serviceTypeList[0]
const spCreatorNodeType = serviceTypeList[1]
const discProvEndpoint1 = 'http://docker.for.mac.localhost:5000'
const creatorNodeEndpoint1 = 'http://docker.for.mac.localhost:4000'
const creatorNodeEndpoint2 = 'http://docker.for.mac.localhost:4010'
const testVersionStr = '0.1.0'

async function run () {
  try {
    let audiusLibs = await initAudiusLibs(true)
    let ethWeb3 = audiusLibs.ethWeb3Manager.getWeb3()
    const ethAccounts = await ethWeb3.eth.getAccounts()

    await distributeTokens(audiusLibs)

    await setServiceVersion(audiusLibs, spDiscProvType, testVersionStr)
    await setServiceVersion(audiusLibs, spCreatorNodeType, testVersionStr)

    await registerLocalService(audiusLibs, spDiscProvType, discProvEndpoint1)
    let audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[1])
    await registerLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint1)
    let audiusLibs3 = await initAudiusLibs(true, null, ethAccounts[2])
    await registerLocalService(audiusLibs3, spCreatorNodeType, creatorNodeEndpoint2)

    await queryLocalServices(audiusLibs, serviceTypeList)

    // await deregisterLocalService(audiusLibs, spDiscProvType, discProvEndpoint1)
    // await deregisterLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint1)

    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

run()
