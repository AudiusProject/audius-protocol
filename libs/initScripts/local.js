const fs = require('fs')
const readline = require('readline');

const initAudiusLibs = require('../examples/initAudiusLibs')
const { distributeTokens } = require('./helpers/distributeTokens')
const { setServiceVersion } = require('./helpers/version')
const {
  registerLocalService,
  queryLocalServices,
  getStakingParameters
} = require('./helpers/spRegistration')
const { deregisterLocalService } = require('./helpers/spRegistration')
const { getClaimInfo, fundNewClaim } = require('./helpers/claim')
const { getDataContractAccounts, getEthContractAccounts } = require('./helpers/utils')
const { default: FontStyles } = require('../../identity-service/src/notifications/renderEmail/FontStyles')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const spDiscProvType = serviceTypeList[0]
const spCreatorNodeType = serviceTypeList[1]
const discProvEndpoint1 = 'http://docker.for.mac.localhost:5000'
const discProvEndpoint2 = 'http://docker.for.mac.localhost:5005'
const creatorNodeEndpoint1 = 'http://docker.for.mac.localhost:4000'
const creatorNodeEndpoint2 = 'http://docker.for.mac.localhost:4010'
const creatorNodeEndpoint3 = 'http://docker.for.mac.localhost:4020'
const creatorNodeEndpoint4 = 'http://docker.for.mac.localhost:4030'
const amountOfAuds = 100000

// try to dynamically get versions from .version.json
let serviceVersions = {}
try {
  serviceTypeList.forEach((type) => {
    serviceVersions[type] = (require(`../../${type}/.version.json`)['version'])
  })
} catch (e) {
  throw new Error("Couldn't get the service versions")
}

const throwArgError = () => {
  throw new Error(`missing argument - format: node local.js [
    distribute,
    fundclaim,
    getclaim,
    stakeinfo,
    setversion,
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
      case 'init':
        console.log('initialized libs')
        break
      case 'distribute':
        console.log('distribute')
        await distributeTokens(audiusLibs, amountOfAuds)
        break

      case 'fundclaim':
        console.log('fundclaim')
        await fundNewClaim(audiusLibs, amountOfAuds)
        break

      case 'getclaim':
        console.log('getclaim')
        await getClaimInfo(audiusLibs)
        break

      case 'stakeinfo':
        console.log('stakeinfo')
        await getStakingParameters(audiusLibs)
        break

      case 'setversion':
        await _initAllVersions(audiusLibs)
        break

      case 'register-discprov-1':
        await _registerDiscProv1(audiusLibs, ethAccounts)
        break

      case 'register-discprov-2':
        await _registerDiscProv2(audiusLibs, ethAccounts)
        break

      case 'register-cnode-1':
        await _registerCnode1(audiusLibs, ethAccounts)
        break

      case 'register-cnode-2':
        await _registerCnode2(audiusLibs, ethAccounts)
        break

      case 'register-cnode-3':
        await _registerCnode3(audiusLibs, ethAccounts)
        break

      case 'register-cnode-4':
        await _registerCnode4(audiusLibs, ethAccounts)
        break

      case 'deregister-sps':
        await _deregisterAllSPs(audiusLibs, ethAccounts)
        break

      case 'query-sps':
        await queryLocalServices(audiusLibs, serviceTypeList)
        break
      
      case 'update-cnode-1-delegatewallet':
        await _updateCnode1DelegateOwnerWallet(ethAccounts)
        break

      case 'update-cnode-2-delegatewallet':
        await _updateCnode2DelegateOwnerWallet(ethAccounts)
        break

      case 'update-cnode-3-delegatewallet':
        await _updateCnode3DelegateOwnerWallet(ethAccounts)
        break

      case 'update-cnode-4-delegatewallet':
        await _updateCnode4DelegateOwnerWallet(ethAccounts)
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
  await distributeTokens(audiusLibs, amountOfAuds)
  await _initAllVersions(audiusLibs)
  await queryLocalServices(audiusLibs, serviceTypeList)
}

// Account 0
const _registerDiscProv1 = async (audiusLibs, ethAccounts) => {
  await registerLocalService(audiusLibs, spDiscProvType, discProvEndpoint1, amountOfAuds)
}

// Account 3
const _registerDiscProv2 = async (audiusLibs, ethAccounts) => {
  let audiusLibs4 = await initAudiusLibs(true, null, ethAccounts[3])
  await registerLocalService(audiusLibs4, spDiscProvType, discProvEndpoint2, amountOfAuds)
}

// Account 1
const _registerCnode1 = async (audiusLibs, ethAccounts) => {
  let acct = ethAccounts[1].toLowerCase()
  let audiusLibs2 = await initAudiusLibs(true, null, acct)
  await registerLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint1, amountOfAuds)
}

// Account 2
const _registerCnode2 = async (audiusLibs, ethAccounts) => {
  let audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[2])
  await registerLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint2, amountOfAuds)
}

// Account 4
const _registerCnode3 = async (audiusLibs, ethAccounts) => {
  let audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[4])
  await registerLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint3, amountOfAuds)
}

// Account 5
const _registerCnode4 = async (audiusLibs, ethAccounts) => {
  let audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[5])
  await registerLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint4, amountOfAuds)
}

// Account 1 - Cnode 1 Delegate Wallet Update
const _updateCnode1DelegateOwnerWallet = async (ethAccounts) => {
  let acct = ethAccounts[1].toLowerCase()
  let readPath = '../creator-node/docker-compose/development.env'
  let writePath = readPath
  let ganacheEthAccounts = await getEthContractAccounts()
  // PKey is now recovered
  let delegateWalletPkey = ganacheEthAccounts['private_keys'][`${acct}`]
  await _updateDelegateOwnerWalletInDockerEnv(readPath, writePath, acct, delegateWalletPkey)
}

// Account 2 - Cnode 2 Delegate Wallet Update
const _updateCnode2DelegateOwnerWallet = async (ethAccounts) => {
  let acct = ethAccounts[2].toLowerCase()
  let readPath = '../creator-node/docker-compose/dev/development2.env'
  let ganacheEthAccounts = await getEthContractAccounts()
  // PKey is now recovered
  let delegateWalletPkey = ganacheEthAccounts['private_keys'][`${acct}`]
  await _updateDelegateOwnerWalletInDockerEnv(readPath, readPath, acct, delegateWalletPkey)
}

// Account 4 - Cnode 3 Delegate Wallet Update
const _updateCnode3DelegateOwnerWallet = async (ethAccounts) => {
  let acct = ethAccounts[4].toLowerCase()
  let readPath = '../creator-node/docker-compose/dev/development3.env'
  let ganacheEthAccounts = await getEthContractAccounts()
  // PKey is now recovered
  let delegateWalletPkey = ganacheEthAccounts['private_keys'][`${acct}`]
  await _updateDelegateOwnerWalletInDockerEnv(readPath, readPath, acct, delegateWalletPkey)
}

// Account 5 - Cnode 4 Delegate Wallet Update
const _updateCnode4DelegateOwnerWallet = async (ethAccounts) => {
  let acct = ethAccounts[5].toLowerCase()
  let readPath = '../creator-node/docker-compose/dev/development4.env'
  let ganacheEthAccounts = await getEthContractAccounts()
  // PKey is now recovered
  let delegateWalletPkey = ganacheEthAccounts['private_keys'][`${acct}`]
  await _updateDelegateOwnerWalletInDockerEnv(readPath, readPath, acct, delegateWalletPkey)
}

const _deregisterAllSPs = async (audiusLibs, ethAccounts) => {
  const audiusLibs1 = audiusLibs
  await deregisterLocalService(audiusLibs1, spDiscProvType, discProvEndpoint1)
  const audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[3])
  await deregisterLocalService(audiusLibs2, spDiscProvType, discProvEndpoint2)

  const audiusLibs3 = await initAudiusLibs(true, null, ethAccounts[1])
  await deregisterLocalService(audiusLibs3, spCreatorNodeType, creatorNodeEndpoint1)
  const audiusLibs4 = await initAudiusLibs(true, null, ethAccounts[2])
  await deregisterLocalService(audiusLibs4, spCreatorNodeType, creatorNodeEndpoint2)
  const audiusLibs5 = await initAudiusLibs(true, null, ethAccounts[4])
  await deregisterLocalService(audiusLibs5, spCreatorNodeType, creatorNodeEndpoint3)
  const audiusLibs6 = await initAudiusLibs(true, null, ethAccounts[5])
  await deregisterLocalService(audiusLibs6, spCreatorNodeType, creatorNodeEndpoint4)
}

const _initAllVersions = async (audiusLibs) => {
  for (let serviceType of serviceTypeList) {
    await setServiceVersion(audiusLibs, serviceType, serviceVersions[serviceType])
  }
}

const _updateDelegateOwnerWalletInDockerEnv = async (readPath, writePath, delegateOwnerWallet, delegateWalletPkey) => {
  const fileStream = fs.createReadStream(readPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  let output = []
  let walletFound = false
  let pkeyFound = false
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if (line.includes('delegateOwnerWallet')) {
      output.push(`delegateOwnerWallet=${delegateOwnerWallet}`)
      walletFound = true
    } else if (line.includes('delegatePrivateKey')) {
      output.push(`delegatePrivateKey=0x${delegateWalletPkey}`)
      pkeyFound = true
    } else {
      output.push(line)
    }
  }

  if (!walletFound) {
    output.push(`delegateOwnerWallet=${delegateOwnerWallet}`)
  }
  if (!pkeyFound) {
    output.push(`delegatePrivateKey=0x${delegateWalletPkey}`)
  }

  let finalUpdatedOutput = output.join("\n")
  fs.writeFileSync(writePath, finalUpdatedOutput)
  console.log(`Updated ${writePath} with ${delegateOwnerWallet}:${delegateWalletPkey}`)
}
