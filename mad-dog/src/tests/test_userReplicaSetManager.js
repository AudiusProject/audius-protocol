const path = require('path')
const axios = require('axios')
const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../logger.js')
const {
  addAndUpgradeUsers
} = require('../helpers.js')
const { exec } = require('child_process')

const DEFAULT_INDEX = 1

/*
const {
  uploadTrack,
  getTrackMetadata,
  getUser,
  verifyCIDExistsOnCreatorNode
} = ServiceCommands
*/

let contentNodeList = null
let contentNodeEndpointToInfoMapping = {}

const {
    getUser
} = ServiceCommands

// const TEMP_STORAGE_PATH = path.resolve('./local-storage/tmp/')
let walletIndexToUserIdMap

const verifyUserReplicaSetStatus = async (
  userId,
  libs
) =>
{
  try {
    // Query user replica set from on chain contract
    let usrReplicaInfoFromContract = await libs.getUserReplicaSet(userId)
    // console.log(usrReplicaInfoFromContract)

    // Query user object
    let usrQueryInfo = await getUser(libs, userId)

    // Deconstruct the comma separated value of enpdoint1,endoint2,endpoint3
    let replicaEndpointArray = usrQueryInfo.creator_node_endpoint.split(",")
    let primaryEndpointString = replicaEndpointArray[0]
    let secondaryEndpointStrings = replicaEndpointArray.slice(1)
    let primaryInfo = contentNodeEndpointToInfoMapping[primaryEndpointString]
    let primaryId = usrQueryInfo.primary

    // Throw if mismatch between queried primaryId and assigned 
    //    spID on chain for this endpoint
    if (primaryId !== primaryInfo.spID) {
      throw new Error(`Mismatch spID values. Expected endpoint for ${primaryId}, found ${primaryInfo.spID}`)
    }

    // Throw if mismatch between primaryId from discovery-node and primaryId in UserReplicaSetManager
    if (primaryId !== parseInt(usrReplicaInfoFromContract.primary)) {
      throw new Error(`Mismatch primaryId values. Expected ${primaryId}, found ${usrReplicaInfoFromContract.primary}`)
    }

    logger.info(`userId: ${userId} Replica Set Info: ${primaryId}, ${usrQueryInfo.secondaries}`)
    logger.info(`userId: ${userId} Replica Set String: ${usrQueryInfo.creator_node_endpoint}`)
    logger.info(`userId: ${userId} primaryId: ${primaryId} primaryIdFromEndointStr: ${primaryInfo.spID}`)

    // Throw if array lengths do not match for secondaries
    if (secondaryEndpointStrings.length !== usrQueryInfo.secondaries.length) {
      throw new Error('Mismatched secondary status')
    }

    // Compare secondary replica ID values
    for (var i = 0; i < usrQueryInfo.secondaries.length; i++) {
      let secondaryId = usrQueryInfo.secondaries[i]
      let secondaryEndpoint = secondaryEndpointStrings[i]
      let secondaryInfoFromStr = contentNodeEndpointToInfoMapping[secondaryEndpoint]
      let secondaryIdFromStr = secondaryInfoFromStr.spID
      logger.info(`userId: ${userId} secondaryId: ${secondaryId} secondaryIdFromEndpointStr: ${secondaryIdFromStr}`)
      // Throw if the ID array does not match the ID mapped to the 
      // endpoint in the legacy creator_node_endpoint 
      if (secondaryId !== secondaryIdFromStr) {
        throw new Error("Invalid write operation")
      }
      // Throw if mismatch between secondaryId from discovery-node and secondaryId in UserReplicaSetManager
      // Index into the array is taken into account here as well
      if (secondaryId !== parseInt(usrReplicaInfoFromContract.secondaries[i])) {
        throw new Error(`Mismatch secondaryId values. Expected ${secondaryId}, found ${usrReplicaInfoFromContract.secondaries[i]}`)
      }
    }
  } catch (e) {
    logger.error(`Error validating userId:${userId} :${e}`)
    throw new Error(e)
  }
}

const getLatestIndexedBlock = async (endpoint) => {
  return (await axios({
    method: 'get',
    baseURL: endpoint,
    url: '/health_check'
  })).data.latest_indexed_block
}

const maxIndexingTimeout = 5000


const waitForBlock = async (libs, targetBlockNumber) => {
  let latestIndexedBlock = await getLatestIndexedBlock(libs.getDiscoveryNodeEndpoint())
  const startTime = Date.now()
  while (Date.now() - startTime < maxIndexingTimeout) {
    latestIndexedBlock = await getLatestIndexedBlock(libs.getDiscoveryNodeEndpoint())
    if (latestIndexedBlock >= targetBlockNumber) {
      logger.info(`Discovery Node has indexed block #${targetBlockNumber}!`)
      return true
    }
  }
  logger.info(`Exiting...reached ${targetBlockNumber}`)
}

const verifyUserReplicaSets = async(executeAll) => {
  // Verify replica state after users have been initialized
  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    // NOTE - It might be easier to just create a map of wallets instead of using 'index'
    const userId = walletIndexToUserIdMap[i]
    await verifyUserReplicaSetStatus(userId, libs) 
  })
}

// Promote each user's secondary1 to primary
// Replica set transitions: (P=Primary, S1=Secondary1, S2 = Secondary2)
// P->S1, S1->P, S2->S2
const promoteSecondary1ToPrimary = async(executeAll) => {
  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    // NOTE - It might be easier to just create a map of wallets instead of using 'index'
    const userId = walletIndexToUserIdMap[i]
    let usrReplicaInfoFromContract = await libs.getUserReplicaSet(userId)
    logger.info(`Reordering ${userId}`)
    let primary = usrReplicaInfoFromContract.primary
    let secondaries = usrReplicaInfoFromContract.secondaries

    let newPrimary = parseInt(secondaries[0])
    let newSecondaries = [primary, secondaries[1]].map(x=>parseInt(x))
    logger.info(`userId: ${userId} | P: ${primary}->${newPrimary}`)
    logger.info(`userId: ${userId} | S1: ${secondaries[0]}->${newSecondaries[0]}`)
    logger.info(`userId: ${userId} | S2: ${secondaries[1]}->${newSecondaries[1]}`)
    let tx = await libs.updateReplicaSet(userId, newPrimary, newSecondaries)
    await waitForBlock(libs, tx.blockNumber)
  })
}

// Promote each user's secondary2 to primary
// Replica set transitions: (P=Primary, S1=Secondary1, S2 = Secondary2)
// P->S2, S1->S1, S2->P
const promoteSecondary2ToPrimary = async(executeAll) => {
  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    // NOTE - It might be easier to just create a map of wallets instead of using 'index'
    const userId = walletIndexToUserIdMap[i]
    let usrReplicaInfoFromContract = await libs.getUserReplicaSet(userId)
    logger.info(`Reordering ${userId}`)
    let primary = usrReplicaInfoFromContract.primary
    let secondaries = usrReplicaInfoFromContract.secondaries

    let newPrimary = parseInt(secondaries[1])
    let newSecondaries = [secondaries[1], primary].map(x=>parseInt(x))
    logger.info(`userId: ${userId} | P: ${primary}->${newPrimary}`)
    logger.info(`userId: ${userId} | S1: ${secondaries[0]}->${newSecondaries[0]}`)
    logger.info(`userId: ${userId} | S2: ${secondaries[1]}->${newSecondaries[1]}`)
    let tx = await libs.updateReplicaSet(userId, newPrimary, newSecondaries)
    await waitForBlock(libs, tx.blockNumber)
  })
}

const userReplicaSetManagerTest = async ({
  numUsers,
  executeAll,
  executeOne,
}) => {
  contentNodeEndpointToInfoMapping = {}
  // Initialize users
  if (!walletIndexToUserIdMap) {
    try {
      walletIndexToUserIdMap = await addAndUpgradeUsers(
        numUsers,
        executeAll,
        executeOne
      )
    } catch (e) {
      return { error: `Issue with creating and upgrading users: ${e}` }
    }
  }

  let contentNodeList = await executeOne(DEFAULT_INDEX, async (libsWrapper) => {
    //   console.log(libsWrapper)
    let endpointsList = await libsWrapper.getServices('content-node') 
    return endpointsList
  })
  contentNodeList.forEach((info)=>{
      contentNodeEndpointToInfoMapping[info.endpoint] = info
  })

  await verifyUserReplicaSets(executeAll)
  await promoteSecondary1ToPrimary(executeAll)
  await verifyUserReplicaSets(executeAll)
  await promoteSecondary2ToPrimary(executeAll)
  await verifyUserReplicaSets(executeAll)
}

module.exports = {
  userReplicaSetManagerTest
}
