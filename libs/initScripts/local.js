const fs = require('fs')
const readline = require('readline')

const initAudiusLibs = require('../examples/initAudiusLibs')
const { distributeTokens } = require('./helpers/distributeTokens')
const { setServiceVersion, addServiceType } = require('./helpers/version')
const {
  registerLocalService,
  queryLocalServices,
  getStakingParameters
} = require('./helpers/spRegistration')
const { deregisterLocalService } = require('./helpers/spRegistration')
const { getClaimInfo, fundNewClaim } = require('./helpers/claim')
const { getEthContractAccounts } = require('./helpers/utils')

// Directories within the audius-protocol repository used for development
const serviceDirectoryList = ['discovery-provider', 'creator-node']
const discProvEndpoint1 = 'http://audius-disc-prov_web-server_1:5000'
const discProvEndpoint2 = 'http://audius-disc-prov_web-server_2:5000'
const creatorNodeEndpoint1 = 'http://cn1_creator-node_1:4000'
const creatorNodeEndpoint2 = 'http://cn2_creator-node_1:4001'
const creatorNodeEndpoint3 = 'http://cn3_creator-node_1:4002'
const creatorNodeEndpoint4 = 'http://cn4_creator-node_1:4003'
const amountOfAuds = 2000000

const contentNodeType = 'content-node'
const contentNodeTypeMin = 200000
const contentNodeTypeMax = 10000000

const discoveryNodeType = 'discovery-node'
const discoveryNodeTypeMin = 200000
const discoveryNodeTypeMax = 7000000

// try to dynamically get versions from .version.json
let serviceVersions = {}
let serviceTypesList = []
try {
  serviceDirectoryList.forEach((type) => {
    let typeInfo = require(`../../${type}/.version.json`)
    let version = typeInfo['version']
    let serviceType = typeInfo['service']
    serviceVersions[serviceType] = version
    serviceTypesList.push(serviceType)
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
    // A separate libs instance
    let userReplicaBootstrapAddressLibs
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

      case 'deregister-sps':
        await _deregisterAllSPs(audiusLibs, ethAccounts)
        break

      case 'query-sps':
        await queryLocalServices(audiusLibs, serviceTypesList)
        break

      case 'query-sps-usrm':
        let usrmLibs = await getUsrmLibs(audiusLibs)
        await queryLocalServices(audiusLibs, serviceTypesList, usrmLibs)
        break

      case 'update-cnode-config': {
        // Update arbitrary cnode
        const serviceCount = args[3]
        if (serviceCount === undefined) throw new Error('update-delegate-wallet requires a service # as the second arg')
        envPath = '../creator-node/compose/env/commonEnv.sh'
        const account = ethAccounts[parseInt(serviceCount)]
        let endpoint = makeCreatorNodeEndpoint(serviceCount)
        await _updateCreatorNodeConfig(account, envPath, envPath, endpoint, /* isShell */ true)
        break
      }

      case 'init-all':
        await _initializeLocalEnvironment(audiusLibs, ethAccounts)
        break

      case 'update-userreplicasetmanager-init-config':
        await _updateUserReplicaSetAddresses(ethAccounts)
        break

      case 'update-user-replica-set':
        console.log(`Usage: node local.js update-user-replica-set userId=1 primary=2 secondaries=3,1`)
        const userIdStr = args[3]
        const primaryReplicaIdStr = args[4]
        const secondaryReplicaIdStr = args[5]
        const userId = parseInt(userIdStr.split('=')[1])
        const primaryReplicaId = parseInt(primaryReplicaIdStr.split('=')[1])
        let secondaryReplicaIds = (secondaryReplicaIdStr.split('=')[1])
        secondaryReplicaIds = secondaryReplicaIds.split(',').map(x => parseInt(x))
        console.log(`Received userId: ${userId}`)
        console.log(`Received primaryReplicaId: ${primaryReplicaId}`)
        console.log(`Received secondaryReplicaIds: ${secondaryReplicaIds}`)
        await updateUserReplicaSet(audiusLibs, userId, primaryReplicaId, secondaryReplicaIds)
        break

      case 'query-user-replica-set':
        console.log(`Usage: node local.js query-user-replica-set userId=1`)
        userReplicaBootstrapAddressLibs = await getUsrmLibs(audiusLibs, 9)
        let userReplicaSet = await userReplicaBootstrapAddressLibs.contracts.UserReplicaSetManagerClient.getUserReplicaSet(
          parseInt(
            args[3].split('=')[1]
          )
        )
        console.log(userReplicaSet)
        break

      case 'query-usrm-content-node-wallet':
          console.log(`Usage: node local.js query-usrm-content-node-wallet spId=1`)
          userReplicaBootstrapAddressLibs = await getUsrmLibs(audiusLibs, 9)
          let contentNodeWallet = await userReplicaBootstrapAddressLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallet(
            parseInt(
              args[3].split('=')[1]
            )
          )
          console.log(contentNodeWallet)
          break

      case 'add-l2-content-node':
        console.log(`Usage: node local.js add-l2-content-node spId=4 delegateWallet=0x95b6A2Be3423dF7D5774...`)
        const spIdStr = args[3]
        const spID = parseInt(spIdStr.split('=')[1])
        const delegateWalletStr = args[4]
        const delegateWallet = delegateWalletStr.split('=')[1]
        console.log(`Configuring L2 ${spID} with wallet: ${delegateWallet}`)
        // Initialize from a different acct than proxy admin
        let queryLibs = await getUsrmLibs(audiusLibs, 9)
        await addL2ContentNode(
          queryLibs,
          ethAccounts,
          spID,
          delegateWallet)
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

/*
  Helper function to bootstrap additional local content nodes onto the L2 local network
  Assumes 3 content nodes are already up prior to execution
*/
const addL2ContentNode = async (
  audiusLibs,
  ethAccounts,
  newCnodeId,
  newCnodeDelegateWallet
) => {
  const existingWalletToCnodeIdL2 = await audiusLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallet(newCnodeId)
  const spIdToWalletPresent = (existingWalletToCnodeIdL2 === newCnodeDelegateWallet)
  if (spIdToWalletPresent) {
    console.log(`No update required! Found ${existingWalletToCnodeIdL2} for spId=${newCnodeId}, expected ${newCnodeDelegateWallet}`)
    return
  }
  console.log(`addL2ContentNode: ${newCnodeId}, ${newCnodeDelegateWallet}`)

  // cn1, cn2, cn3 are all initialized to the 1,2,3 indexes into local ethAccounts array
  // NOTE: Proposer Accounts must match the deployed bootstrap addresses on UserReplicaSetManager
  //  Changing any of the below indices will affect the wallets performing this update and operations will fail
  const proposer1WalletIndex = 1
  const proposer2WalletIndex = 2
  const proposer3WalletIndex = 3
  // Local service provider IDs assigned by eth-contracts
  // These values just HAPPEN to coincide with the indices above but are set explicitly to avoid confusion
  const proposer1SpId = 1
  const proposer2SpId = 2
  const proposer3SpId = 3
  // Retrieve the wallet associated with each index
  const proposer1Wallet = ethAccounts[parseInt(proposer1WalletIndex)]
  const proposer2Wallet = ethAccounts[parseInt(proposer2WalletIndex)]
  const proposer3Wallet = ethAccounts[parseInt(proposer3WalletIndex)]
  console.log(`proposer1Wallet: ${proposer1Wallet}`)
  console.log(`proposer2Wallet: ${proposer2Wallet}`)
  console.log(`proposer3Wallet: ${proposer3Wallet}`)

  // Initialize libs with each incoming proposer
  const proposer1Libs = await initAudiusLibs(true, null, proposer1Wallet)
  const proposer1EthAddress = proposer1Libs.ethWeb3Manager.getWalletAddress()
  const proposer1EthWeb3 = proposer1Libs.ethWeb3Manager.getWeb3()
  console.log(`Initialized proposer1 libs, proposer1EthAddress: ${proposer1EthAddress}`)
  let proposer1SignatureInfo = await audiusLibs.contracts.UserReplicaSetManagerClient.getProposeAddOrUpdateContentNodeRequestData(
    newCnodeId,
    newCnodeDelegateWallet,
    proposer1SpId,
    proposer1Wallet,
    proposer1EthWeb3
  )
  console.dir(proposer1SignatureInfo, { depth: 5 })

  const proposer2Libs = await initAudiusLibs(true, null, proposer2Wallet)
  const proposer2EthAddress = proposer2Libs.ethWeb3Manager.getWalletAddress()
  const proposer2EthWeb3 = proposer2Libs.ethWeb3Manager.getWeb3()
  console.log(`Initialized proposer2 libs, proposer2EthAddress: ${proposer2EthAddress}`)
  let proposer2SignatureInfo = await audiusLibs.contracts.UserReplicaSetManagerClient.getProposeAddOrUpdateContentNodeRequestData(
    newCnodeId,
    newCnodeDelegateWallet,
    proposer2SpId,
    proposer2Wallet,
    proposer2EthWeb3
  )
  console.dir(proposer2SignatureInfo, { depth: 5 })

  const proposer3Libs = await initAudiusLibs(true, null, proposer3Wallet)
  const proposer3EthAddress = proposer3Libs.ethWeb3Manager.getWalletAddress()
  const proposer3EthWeb3 = proposer3Libs.ethWeb3Manager.getWeb3()
  console.log(`Initialized proposer3 libs, proposer3EthAddress: ${proposer3EthAddress}`)
  let proposer3SignatureInfo = await audiusLibs.contracts.UserReplicaSetManagerClient.getProposeAddOrUpdateContentNodeRequestData(
    newCnodeId,
    newCnodeDelegateWallet,
    proposer3SpId,
    proposer3Wallet,
    proposer3EthWeb3
  )
  console.dir(proposer3SignatureInfo, { depth: 5 })

  // Generate arguments for proposal
  const proposerSpIds = [proposer1SpId, proposer2SpId, proposer3SpId]
  const proposerNonces = [
    proposer1SignatureInfo.nonce,
    proposer2SignatureInfo.nonce,
    proposer3SignatureInfo.nonce
  ]

  await audiusLibs.contracts.UserReplicaSetManagerClient.addOrUpdateContentNode(
    newCnodeId,
    newCnodeDelegateWallet,
    proposerSpIds,
    proposerNonces,
    proposer1SignatureInfo.sig,
    proposer2SignatureInfo.sig,
    proposer3SignatureInfo.sig
  )
}

// In order to issue operations we need a libs account initialized from a different address than
// the 0th account on local data-contracts
// This function explicitly queries the 20th account from data-contracts ganache
// Returns libs instance logged in as said account
const getUsrmLibs = async (defaultAudiusLibs, acctIndex = 20) => {
  let dataWeb3 = defaultAudiusLibs.web3Manager.getWeb3()
  let dataWeb3Accounts = await dataWeb3.eth.getAccounts()
  let localQueryAccount = dataWeb3Accounts[acctIndex]
  let usrmLibs = await initAudiusLibs(true, localQueryAccount)
  return usrmLibs
}

// Update a user's replica set on chain
// Using the bootstrap address configured for local development (accounts[9])
const updateUserReplicaSet = async (
  defaultAudiusLibs,
  userId,
  primaryId,
  secondaryIds
) => {
  // UserReplicaBootstrapLibs, logged in as the known bootstrap address
  let userReplicaBootstrapAddressLibs = await getUsrmLibs(defaultAudiusLibs, 9)
  let sp1Id = primaryId
  let sp1DelWal = await userReplicaBootstrapAddressLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallet(sp1Id)
  console.log(`spId <-> delegateWallet from UserReplicaSetManager: ${sp1Id} - ${sp1DelWal}`)
  let sp2Id = secondaryIds[0]
  let sp2DelWal = await userReplicaBootstrapAddressLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallet(sp2Id)
  console.log(`spId <-> delegateWallet from UserReplicaSetManager: ${sp2Id} - ${sp2DelWal}`)
  let sp3Id = secondaryIds[1]
  let sp3DelWal = await userReplicaBootstrapAddressLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallet(sp3Id)
  console.log(`spId <-> delegateWallet from UserReplicaSetManager: ${sp3Id} - ${sp3DelWal}`)
  let user1ReplicaSet = await userReplicaBootstrapAddressLibs.contracts.UserReplicaSetManagerClient.getUserReplicaSet(userId)
  console.log(`User ${userId} replica set prior to update: ${JSON.stringify(user1ReplicaSet)}`)
  console.log(`User ${userId} replica set updating to primary=${primaryId}, secondaries=${secondaryIds}`)
  // Uncomment to perform update operation
  let tx1 = await userReplicaBootstrapAddressLibs.contracts.UserReplicaSetManagerClient.updateReplicaSet(
    userId,
    primaryId,
    secondaryIds,
    user1ReplicaSet.primary,
    user1ReplicaSet.secondaries
  )
  console.dir(tx1, { depth: 5 })
  let user1ReplicaSetAfterUpdate = await userReplicaBootstrapAddressLibs.contracts.UserReplicaSetManagerClient.getUserReplicaSet(userId)
  console.log(`User ${userId} replica set after to update: ${JSON.stringify(user1ReplicaSetAfterUpdate)}`)
}

const _initializeLocalEnvironment = async (audiusLibs, ethAccounts) => {
  await distributeTokens(audiusLibs, amountOfAuds)
  await _initEthContractTypes(audiusLibs)
  await _initAllVersions(audiusLibs)
  await queryLocalServices(audiusLibs, serviceTypesList)
}

// Account 0
const _registerDiscProv1 = async (audiusLibs, ethAccounts) => {
  await registerLocalService(audiusLibs, discoveryNodeType, discProvEndpoint1, amountOfAuds)
}

// Account 3
const _registerDiscProv2 = async (audiusLibs, ethAccounts) => {
  let audiusLibs4 = await initAudiusLibs(true, null, ethAccounts[3])
  await registerLocalService(audiusLibs4, discoveryNodeType, discProvEndpoint2, amountOfAuds)
}

const makeCreatorNodeEndpoint = (serviceNumber) => `http://cn${serviceNumber}_creator-node_1:${4000 + parseInt(serviceNumber) - 1}`

// Templated cnode to allow for dynamic number of services
const _registerCnode = async (ethAccounts, serviceNumber) => {
  const audiusLibs = await initAudiusLibs(true, null, ethAccounts[serviceNumber])
  const endpoint = makeCreatorNodeEndpoint(serviceNumber)
  await registerLocalService(audiusLibs, contentNodeType, endpoint, amountOfAuds)
}

const _updateCreatorNodeConfig = async (account, readPath, writePath = readPath, endpoint = null, isShell = false) => {
  let acct = account.toLowerCase()
  let ganacheEthAccounts = await getEthContractAccounts()
  // PKey is now recovered
  let delegateWalletPkey = ganacheEthAccounts['private_keys'][`${acct}`]
  await _updateCreatorNodeConfigFile(readPath, writePath, acct, delegateWalletPkey, endpoint, isShell)
}

const _deregisterAllSPs = async (audiusLibs, ethAccounts) => {
  const audiusLibs1 = audiusLibs
  await deregisterLocalService(audiusLibs1, discoveryNodeType, discProvEndpoint1)
  const audiusLibs2 = await initAudiusLibs(true, null, ethAccounts[3])
  await deregisterLocalService(audiusLibs2, discoveryNodeType, discProvEndpoint2)

  const audiusLibs3 = await initAudiusLibs(true, null, ethAccounts[1])
  await deregisterLocalService(audiusLibs3, contentNodeType, creatorNodeEndpoint1)
  const audiusLibs4 = await initAudiusLibs(true, null, ethAccounts[2])
  await deregisterLocalService(audiusLibs4, contentNodeType, creatorNodeEndpoint2)
  const audiusLibs5 = await initAudiusLibs(true, null, ethAccounts[4])
  await deregisterLocalService(audiusLibs5, contentNodeType, creatorNodeEndpoint3)
  const audiusLibs6 = await initAudiusLibs(true, null, ethAccounts[5])
  await deregisterLocalService(audiusLibs6, contentNodeType, creatorNodeEndpoint4)
}

const _initAllVersions = async (audiusLibs) => {
  for (let serviceType of serviceTypesList) {
    await setServiceVersion(audiusLibs, serviceType, serviceVersions[serviceType])
  }
}

const _initEthContractTypes = async (libs) => {
  console.log(`Registering additional service type ${contentNodeType} - Min=${contentNodeTypeMin}, Max=${contentNodeTypeMax}`)
  // Add content-node serviceType
  await addServiceType(libs, contentNodeType, contentNodeTypeMin, contentNodeTypeMax)
  console.log(`Registering additional service type ${contentNodeType} - Min=${contentNodeTypeMin}, Max=${contentNodeTypeMax}`)
  // Add discovery-node serviceType
  await addServiceType(libs, discoveryNodeType, discoveryNodeTypeMin, discoveryNodeTypeMax)
}

// Write an update to either the common .sh file for creator nodes or docker env file
const _updateCreatorNodeConfigFile = async (readPath, writePath, ownerWallet, ownerWalletPkey, endpoint, isShell) => {
  const fileStream = fs.createReadStream(readPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  let output = []
  let delegateOwnerWalletFound = false
  let spOwnerWalletFound = false
  let pkeyFound = false
  let endpointFound = false

  // Local dev, delegate and owner wallet are equal
  let delegateOwnerWallet = ownerWallet
  let delegateWalletPkey = ownerWalletPkey

  const spOwnerWalletLine = `${isShell ? 'export ' : ''}spOwnerWallet=${ownerWallet}`
  const delegateOwnerWalletLine = `${isShell ? 'export ' : ''}delegateOwnerWallet=${delegateOwnerWallet}`
  const pkeyLine = `${isShell ? 'export ' : ''}delegatePrivateKey=0x${delegateWalletPkey}`
  const endpointLine = `${isShell ? 'export ' : ''}creatorNodeEndpoint=${endpoint}`

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    if (line.includes('delegateOwnerWallet')) {
      output.push(delegateOwnerWalletLine)
      delegateOwnerWalletFound = true
    } else if (line.includes('delegatePrivateKey')) {
      output.push(pkeyLine)
      pkeyFound = true
    } else if (line.includes('creatorNodeEndpoint')) {
      output.push(endpointLine)
      endpointFound = true
    } else if (line.includes('spOwnerWallet')) {
      output.push(spOwnerWalletLine)
      spOwnerWalletFound = true
    } else {
      output.push(line)
    }
  }

  if (!delegateOwnerWalletFound) {
    output.push(delegateOwnerWalletLine)
  }
  if (!pkeyFound) {
    output.push(pkeyLine)
  }
  if (!endpointFound) {
    output.push(endpointLine)
  }
  if (!spOwnerWalletFound) {
    output.push(spOwnerWalletLine)
  }

  fs.writeFileSync(writePath, output.join('\n'))
  console.log(`Updated ${writePath} with spOwnerWallet=${ownerWallet}\ndelegateOwnerWallet=${delegateOwnerWallet}\ndelegateWalletPkey=${delegateWalletPkey}\nendpoint=${endpoint}`)
}

const _updateUserReplicaSetAddresses = async (ethAccounts) => {
  const dataContractConfigPath = '../contracts/contract-config.js'
  const fileStream = fs.createReadStream(dataContractConfigPath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  const bootstrapSPIds = [1, 2, 3]
  const bootstrapSPDelegateWallets = bootstrapSPIds.map((id) => {
    return ethAccounts[id]
  })
  const bootstrapSPIdsString = `    bootstrapSPIds: [${bootstrapSPIds}],`
  const bootstrapSPDelegateWalletsString = `    bootstrapSPDelegateWallets: ['${bootstrapSPDelegateWallets[0]}', '${bootstrapSPDelegateWallets[1]}', '${bootstrapSPDelegateWallets[2]}'],`
  console.log(`Initializing UserReplicaSetManager configuration from known delegateWallets within system...`)
  console.log(`Bootstrapping with ${bootstrapSPIds}, ${bootstrapSPDelegateWallets}`)

  let traversingDevelopmentConfigBlock = false
  let output = []
  for await (const line of rl) {
    if (line.includes('development')) {
      traversingDevelopmentConfigBlock = true
      output.push(line)
    } else if (line.includes('test_local')) {
      traversingDevelopmentConfigBlock = false
      output.push(line)
    } else if (traversingDevelopmentConfigBlock && line.includes('bootstrapSPIds')) {
      output.push(bootstrapSPIdsString)
    } else if (traversingDevelopmentConfigBlock && line.includes('bootstrapSPDelegateWallets')) {
      output.push(bootstrapSPDelegateWalletsString)
    } else {
      output.push(line)
    }
  }
  fs.writeFileSync(dataContractConfigPath, output.join('\n'))
  console.log(`Updated ${dataContractConfigPath} with bootstrapSPIds=${bootstrapSPIds} and bootstrapSPDelegateWallets=${bootstrapSPDelegateWallets}`)
}
