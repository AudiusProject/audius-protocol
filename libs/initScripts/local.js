const fs = require('fs')
const readline = require('readline')

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
const { getEthContractAccounts } = require('./helpers/utils')

const serviceTypeList = ['discovery-provider', 'creator-node']
const spDiscProvType = serviceTypeList[0]
const spCreatorNodeType = serviceTypeList[1]
const discProvEndpoint1 = 'http://audius-disc-prov_web-server_1:5000'
const discProvEndpoint2 = 'http://audius-disc-prov_web-server_2:5000'
const creatorNodeEndpoint1 = 'http://cn1_creator-node_1:4000'
const creatorNodeEndpoint2 = 'http://cn2_creator-node_1:4001'
const creatorNodeEndpoint3 = 'http://cn3_creator-node_1:4002'
const creatorNodeEndpoint4 = 'http://cn4_creator-node_1:4003'
const amountOfAuds = 200000

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
    let envPath

    switch (args[2]) {
      case 'init':
        console.log('initialized libs')
        break
      case 'distribute':
        await distributeTokens(audiusLibs, amountOfAuds)
        break

      case 'fundclaim':
        await fundNewClaim(audiusLibs, amountOfAuds)
        break

      case 'getclaim':
        await getClaimInfo(audiusLibs)
        break

      case 'stakeinfo':
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

      case 'register-cnode': {
        const serviceCount = args[3]
        if (serviceCount === undefined) throw new Error('register-cnode requires a service # as the second arg')
        await _registerCnode(ethAccounts, parseInt(serviceCount))
        break
      }

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

      case 'add-cnode-delegatewallet-data-contracts': {
        // Update arbitrary cnode
        const spID = args[3]
        if (spID === undefined) {
          throw new Error('add-cnode-delegatewallet-data-contracts requires a spID # as the second arg')
        }
        await _updateUserReplicaSetManagerDelegateWallet(spID, audiusLibs)
        break
      }

      case 'update-delegate-wallet': {
        console.log(`WARNING: This function update delegate wallet and creator node endpoint in each service config`)
        console.log(`This is intentional for our working branch to have the same surface area as master for service-commands`)
        // Update arbitrary cnode
        const serviceNumber = args[3]
        if (serviceNumber === undefined) throw new Error('update-delegate-wallet requires a service # as the second arg')
        envPath = '../creator-node/compose/env/commonEnv.sh'
        const account = ethAccounts[parseInt(serviceNumber)]
        let endpoint = makeCreatorNodeEndpoint(serviceNumber)
        console.log(`Generated ${endpoint} for creatorNode ${serviceNumber}`)
        await _updateConfigFile(account, envPath, envPath, /* isShell */ true, endpoint)
        break
      }

      case 'update-cnode-1-delegatewallet':
        // Account 1 - Cnode 1 Delegate Wallet Update
        envPath = '../creator-node/docker-compose/development.env'
        await _updateConfigFile(ethAccounts[1], envPath, envPath)
        break

      case 'update-cnode-2-delegatewallet':
        // Account 2 - Cnode 2 Delegate Wallet Update
        envPath = '../creator-node/docker-compose/dev/development2.env'
        await _updateConfigFile(ethAccounts[2], envPath, envPath)
        break

      case 'update-cnode-3-delegatewallet':
        // Account 4 - Cnode 3 Delegate Wallet Update
        envPath = '../creator-node/docker-compose/dev/development3.env'
        await _updateConfigFile(ethAccounts[4], envPath, envPath)
        break

      case 'update-cnode-4-delegatewallet':
        // Account 5 - Cnode 4 Delegate Wallet Update
        envPath = '../creator-node/docker-compose/dev/development4.env'
        await _updateConfigFile(ethAccounts[5], envPath, envPath)
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

const makeCreatorNodeEndpoint = (serviceNumber) => `http://cn${serviceNumber}_creator-node_1:${4000 + parseInt(serviceNumber) - 1}`

const _registerCnode = async (ethAccounts, serviceNumber) => {
  const audiusLibs = await initAudiusLibs(true, null, ethAccounts[serviceNumber])
  const endpoint = makeCreatorNodeEndpoint(serviceNumber)
  await registerLocalService(audiusLibs, spCreatorNodeType, endpoint, amountOfAuds)
  let spID = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(endpoint)
  console.log(`Configuring UserReplicaSetManager contract for spID=${spID}`)
  await _updateUserReplicaSetManagerDelegateWallet(spID, audiusLibs)
  console.log(`Configured UserReplicaSetManager contract`)
  await queryLocalServices(audiusLibs, serviceTypeList)
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

// Account 3
const _registerCnode3 = async (audiusLibs, ethAccounts) => {
  let audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[3])
  await registerLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint3, amountOfAuds)
}

// Account 4
const _registerCnode4 = async (audiusLibs, ethAccounts) => {
  let audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[4])
  await registerLocalService(audiusLibs2, spCreatorNodeType, creatorNodeEndpoint4, amountOfAuds)
}

// Overwrite delegateOwnerWallet, delegatePrivateKey, and optionally creatorNodeEndpoint
const _updateConfigFile = async (account, readPath, writePath = readPath, isShell = false, endpoint = null) => {
  let acct = account.toLowerCase()
  let ganacheEthAccounts = await getEthContractAccounts()
  // PKey is now recovered
  let delegateWalletPkey = ganacheEthAccounts['private_keys'][`${acct}`]
  await _writeConfigFile(readPath, writePath, acct, delegateWalletPkey, isShell, endpoint)
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

// Register spID <-> delegateOwnerWallet on UserReplicaSetManager
const _updateUserReplicaSetManagerDelegateWallet = async (spID, defaultLibs) => {
  let web3 = defaultLibs.web3Manager.getWeb3()
  const accounts = await web3.eth.getAccounts()
  const zeroAddress = '0x0000000000000000000000000000000000000000'
  let cnType = 'creator-node'
  let spClient = defaultLibs.ethContracts.ServiceProviderFactoryClient
  let rsManagerClient = defaultLibs.contracts.UserReplicaSetManagerClient
  let spInfo = await spClient.getServiceEndpointInfo(cnType, spID)

  // Exit if this spID is not present in eth-contracts
  if (spInfo.owner === zeroAddress) {
    console.log(`${spID} invalid, no matching provider found`)
    return
  }

  // Check whether the spID <-> delegateOwnerWallet is already up to date
  let currentWallet = await rsManagerClient.getCreatorNodeWallet(spID)
  if (currentWallet === spInfo.delegateOwnerWallet) {
    console.log(`Already up to date! spID=${spID} - delegateOwnerWallet=${currentWallet} matches on eth-contracts and data-contracts`)
    return
  }

  // Retrieve all cnodes
  let allCnodes = await spClient.getServiceProviderList(cnType)
  // Exclude current spID owner from list
  let otherCnodes = allCnodes.filter(x => x.owner !== spInfo.owner)
  // If no other cnodes are found, the only valid caller is the contract deployer
  if (otherCnodes.length === 0) {
    let deployer = accounts[0]
    console.log(`No cnodes found, registering from deployer ${deployer}`)
    // Register from deployer libs instance
    await rsManagerClient.addOrUpdateCreatorNode(spID, spInfo.delegateOwnerWallet, 0)
    return
  }

  // Iterate over all cnodes
  for (const n of otherCnodes) {
    let nodeSPId = n.spID
    let nodeWalletFromDataContracts = await rsManagerClient.getCreatorNodeWallet(nodeSPId)
    // Confirm this cnode has been registered with UserReplicaSetManager
    if (
      nodeWalletFromDataContracts !== zeroAddress &&
      nodeWalletFromDataContracts === n.delegateOwnerWallet
    ) {
      let senderWallet = nodeWalletFromDataContracts
      // Initialize libs with the account that is already registered on UserReplicaSetManager
      // NOTE - the only reason this works locally is because ganache accounts are all unlocked
      //         In reality what should happen is a registration from the deployer ONLY for the first cnode
      //         All others will use the WIP 'chain-of-trust' auth scheme to onboard themselves by
      //         broadcasting a request to other cnodes
      let otherCnodeLibs = await initAudiusLibs(true, null, senderWallet)
      await otherCnodeLibs.contracts.UserReplicaSetManagerClient.addOrUpdateCreatorNode(
        spID,
        spInfo.delegateOwnerWallet,
        nodeSPId
      )
      console.log(`Updated spID ${spID} - ${spInfo.delegateOwnerWallet} from account ${senderWallet}`)
    }
  }
}

// Overwrite configs in either shell file or .env
// If not found, configs appeneded to end of file
const _writeConfigFile = async (readPath, writePath, delegateOwnerWallet, delegateWalletPkey, isShell, endpoint = null) => {
  const fileStream = fs.createReadStream(readPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  let output = []
  let walletFound = false
  let pkeyFound = false
  const ownerWalletLine = `${isShell ? 'export ' : ''}delegateOwnerWallet=${delegateOwnerWallet}`
  const pkeyLine = `${isShell ? 'export ' : ''}delegatePrivateKey=0x${delegateWalletPkey}`

  let endpointLine = null
  let endpointFound = false
  if (endpoint) {
    endpointLine = `${isShell ? 'export ' : ''}creatorNodeEndpoint=${endpoint}`
    console.log(endpointLine)
  }

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if (line.includes('delegateOwnerWallet')) {
      output.push(ownerWalletLine)
      walletFound = true
    } else if (line.includes('delegatePrivateKey')) {
      output.push(pkeyLine)
      pkeyFound = true
    } else if (endpoint && (line.includes('creatorNodeEndpoint'))) {
      output.push(endpointLine)
      endpointFound = true
    } else {
      output.push(line)
    }
  }

  if (!walletFound) {
    output.push(ownerWalletLine)
  }
  if (!pkeyFound) {
    output.push(pkeyLine)
  }
  if (endpoint && !endpointFound) {
    output.push(endpointLine)
  }

  fs.writeFileSync(writePath, output.join('\n'))
  console.log(`Updated ${writePath} with ${delegateOwnerWallet}:${delegateWalletPkey} ${endpoint}`)
}
