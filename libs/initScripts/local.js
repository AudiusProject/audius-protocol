const initAudiusLibs = require('../examples/initAudiusLibs')
const { distributeTokens } = require('./helpers/distributeTokens')
const { setServiceVersion } = require('./helpers/version')
const { registerLocalService, queryLocalServices, getStakingParameters } = require('./helpers/spRegistration')
const { deregisterLocalService } = require('./helpers/spRegistration')
const { getClaimInfo, fundNewClaim } = require('./helpers/claim')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const spDiscProvType = serviceTypeList[0]
const spCreatorNodeType = serviceTypeList[1]
const discProvEndpoint1 = 'http://docker.for.mac.localhost:5000'
const creatorNodeEndpoint1 = 'http://docker.for.mac.localhost:4000'
const creatorNodeEndpoint2 = 'http://docker.for.mac.localhost:4010'
const testVersionStr = '0.1.0'

const throwArgError = () => {
  throw new Error(`missing argument - format: node examples/initiateStakingOperations.js [
    distribute,
    fundclaim,
    getclaim,
    stakeinfo,
    initversions,
    register-sps,
    deregister-sps,
    query-sps,
    init-all
  ]`)
}

let args = process.argv
if (args.length < 3) {
  throwArgError()
}

const run = async () => {
  try {
    let audiusLibs = await initAudiusLibs(true)
    let ethWeb3 = audiusLibs.ethWeb3Manager.getWeb3()
    const ethAccounts = await ethWeb3.eth.getAccounts()

    switch (args[2]) {
      case 'distribute':
        console.log('distribute')
        await distributeTokens(audiusLibs)
        break

      case 'fundclaim':
        console.log('fundclaim')
        await fundNewClaim(audiusLibs)
        break

      case 'getclaim':
        console.log('getclaim')
        await getClaimInfo(audiusLibs)
        break

      case 'stakeinfo':
        console.log('stakeinfo')
        await getStakingParameters(audiusLibs)
        break

      case 'initversions':
        await _initAllVersions(audiusLibs)
        break

      case 'register-sps':
        await _registerAllSPs(audiusLibs, ethAccounts)
        break

      case 'deregister-sps':
        await _deregisterAllSPs(audiusLibs, ethAccounts)
        break

      case 'query-sps':
        await queryLocalServices(audiusLibs, serviceTypeList)
        break

      case 'init-all':
        await _initializeLocalEnvironment(audiusLibs, ethAccounts)
        break
      default:
        throwArgError()
    }

    process.exit(0)
  } catch (e) {
    throw e
  }
}

run()

const _initializeLocalEnvironment = async (audiusLibs, ethAccounts) => {
  await distributeTokens(audiusLibs)
  await _initAllVersions(audiusLibs)
  await _registerAllSPs(audiusLibs, ethAccounts)
  await queryLocalServices(audiusLibs, serviceTypeList)
}

const _registerAllSPs = async (audiusLibs, ethAccounts) => {
  await registerLocalService(audiusLibs, spDiscProvType, discProvEndpoint1)

  let audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[1])
  await registerLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint1)

  let audiusLibs3 = await initAudiusLibs(true, null, ethAccounts[2])
  await registerLocalService(audiusLibs3, spCreatorNodeType, creatorNodeEndpoint2)
}

const _deregisterAllSPs = async (audiusLibs, ethAccounts) => {
  await deregisterLocalService(audiusLibs, spDiscProvType, discProvEndpoint1)

  let audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[1])
  await deregisterLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint1)

  let audiusLibs3 = await initAudiusLibs(true, null, ethAccounts[2])
  await deregisterLocalService(audiusLibs3, spCreatorNodeType, creatorNodeEndpoint2)
}

const _initAllVersions = async (audiusLibs) => {
  for (let serviceType of serviceTypeList) {
    await setServiceVersion(audiusLibs, serviceType, testVersionStr)
  }
}
