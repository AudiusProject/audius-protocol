const axios = require('axios')
const assert = require('assert')
const _ = require('lodash')

const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../logger.js')
const {
  addAndUpgradeUsers
} = require('../helpers.js')

const DEFAULT_INDEX = 1
const BOOTSTRAP_SP_IDS = new Set([1,2,3])
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

let contentNodeEndpointToInfoMapping = {}
let walletIndexToUserIdMap

const {
    getUser
} = ServiceCommands

const verifyUserReplicaSetStatus = async (
  userId,
  libs,
  replicaSetUpdaterAddress = null
) =>
{
  try {
    // Query user replica set from on chain contract
    let usrReplicaInfoFromContract = await libs.getUserReplicaSet(userId)

    // Query user object
    let usrQueryInfo = await getUser(libs, userId)

    // Validate the latest updater indexed into discovery node matches expected value
    let replicaSetUpdateSigner = replicaSetUpdaterAddress
    if (!replicaSetUpdateSigner) {
      replicaSetUpdateSigner = libs.getWalletAddress()
    }
    let queriedReplicaSetUpdateSigner = usrQueryInfo.replica_set_update_signer.toLowerCase()
    let expectedUpdaterFound = replicaSetUpdateSigner === queriedReplicaSetUpdateSigner
    if (!expectedUpdaterFound) {
      throw new Error('Invalid replica set updater found')
    }

    // Deconstruct the comma separated value of enpdoint1,endoint2,endpoint3
    let replicaEndpointArray = usrQueryInfo.creator_node_endpoint.split(",")
    let primaryEndpointString = replicaEndpointArray[0]
    let secondaryEndpointStrings = replicaEndpointArray.slice(1)
    let primaryInfo = contentNodeEndpointToInfoMapping[primaryEndpointString]
    let primaryID = usrQueryInfo.primary_id

    // Throw if mismatch between queried primaryID and assigned
    //    spID on chain for this endpoint
    if (primaryID !== primaryInfo.spID) {
      throw new Error(`Mismatch spID values. Expected endpoint for ${primaryID}, found ${primaryInfo.spID}`)
    }

    // Throw if mismatch between primaryID from discovery-node and primaryID in UserReplicaSetManager
    if (primaryID !== parseInt(usrReplicaInfoFromContract.primaryId)) {
      throw new Error(`Mismatch primaryID values. Expected ${primaryID}, found ${usrReplicaInfoFromContract.primaryId}`)
    }

    logger.info(`userId: ${userId} Replica Set Info: ${primaryID}, ${usrQueryInfo.secondary_ids}`)
    logger.info(`userId: ${userId} Replica Set String: ${usrQueryInfo.creator_node_endpoint}`)
    logger.info(`userId: ${userId} primaryID: ${primaryID} primaryIdFromEndointStr: ${primaryInfo.spID}`)

    // Throw if array lengths do not match for secondary_ids
    if (secondaryEndpointStrings.length !== usrQueryInfo.secondary_ids.length) {
      throw new Error('Mismatched secondary status')
    }

    // Compare secondary replica ID values
    for (var i = 0; i < usrQueryInfo.secondary_ids.length; i++) {
      let secondaryId = usrQueryInfo.secondary_ids[i]
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
      if (secondaryId !== parseInt(usrReplicaInfoFromContract.secondaryIds[i])) {
        throw new Error(`Mismatch secondaryId values. Expected ${secondaryId}, found ${usrReplicaInfoFromContract.secondaryIDs[i]}`)
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

const maxIndexingTimeout = 15000


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
  throw new Error(`Failed to reach ${targetBlockNumber} in ${maxIndexingTimeout}`)
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
    logger.info(`userId: ${userId}: promoteSecondary1ToPrimary`)
    let primary = usrReplicaInfoFromContract.primaryId
    let secondaries = usrReplicaInfoFromContract.secondaryIds

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
    logger.info(`userId: ${userId}: promoteSecondary2ToPrimary`)
    let primary = usrReplicaInfoFromContract.primaryId
    let secondaries = usrReplicaInfoFromContract.secondaryIds

    let newPrimary = parseInt(secondaries[1])
    let newSecondaries = [secondaries[0], primary].map(x=>parseInt(x))
    logger.info(`userId: ${userId} | P: ${primary}->${newPrimary}`)
    logger.info(`userId: ${userId} | S1: ${secondaries[0]}->${newSecondaries[0]}`)
    logger.info(`userId: ${userId} | S2: ${secondaries[1]}->${newSecondaries[1]}`)
    let tx = await libs.updateReplicaSet(userId, newPrimary, newSecondaries)
    await waitForBlock(libs, tx.blockNumber)
  })
}

// Promote each user's secondary2 to primary
// Replica set transitions: (P=Primary, S1=Secondary1, S2 = Secondary2)
// P->P, S1->S2, S2->S1
const swapSecondaries = async(executeAll) => {
  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    // NOTE - It might be easier to just create a map of wallets instead of using 'index'
    const userId = walletIndexToUserIdMap[i]
    let usrReplicaInfoFromContract = await libs.getUserReplicaSet(userId)
    logger.info(`userId: ${userId}: swapSecondaries`)
    let primary = usrReplicaInfoFromContract.primaryId
    let secondaries = usrReplicaInfoFromContract.secondaryIds
    let newPrimary = primary
    let newSecondaries = [secondaries[1], secondaries[0]].map(x=>parseInt(x))
    logger.info(`userId: ${userId} | P: ${primary}->${newPrimary}`)
    logger.info(`userId: ${userId} | S1: ${secondaries[0]}->${newSecondaries[0]}`)
    logger.info(`userId: ${userId} | S2: ${secondaries[1]}->${newSecondaries[1]}`)
    let tx = await libs.updateReplicaSet(userId, newPrimary, newSecondaries)
    await waitForBlock(libs, tx.blockNumber)
  })
}

// Verify indexed state matches content nodes registered in UserReplicaSetManager
// Also confirms UserReplicaSetManager state maches eth-contracts
const verifyUrsmContentNodes = async (executeOne) => {
  logger.info(`Validating content-nodes on UserReplicaSetManager`)

  await executeOne(DEFAULT_INDEX, async (libs)=> {
    // Get Content Nodes indexed by Discovery Node
    // TODO - how to test that DN has indexed all registered URSMContentNodes?
    let queriedContentNodes = await libs.getURSMContentNodes()

    // Convert list of nodes to map by spID
    const queriedContentNodesMap = queriedContentNodes.reduce((map, node) => {
      map[node.cnode_sp_id] = node
      return map
    }, {})

    // Perform validation on each node
    await Promise.all(queriedContentNodes.map(async (queriedNodeInfo) => {
      let spID = queriedNodeInfo.cnode_sp_id
      let queriedDelegateOwnerWallet = queriedNodeInfo.delegate_owner_wallet
      let queriedOwnerWallet = queriedNodeInfo.owner_wallet

      /**
       * Recover content node info from URSM
       */
      let walletInfoFromChain = await libs.getContentNodeWallets(spID)
      let delegateWalletFromChain = walletInfoFromChain.delegateOwnerWallet
      let ownerWalletFromChain = walletInfoFromChain.ownerWallet

      /**
       * Query POA contract and confirm IDs
       */
      if (queriedDelegateOwnerWallet !== delegateWalletFromChain) {
        throw new Error(
          `Mismatch between UserReplicaSetManager chain delegateOwnerWallet: ${delegateWalletFromChain} and queried delegateownerWallet: ${queriedDelegateOwnerWallet}`
        )
      }
      if (queriedOwnerWallet !== ownerWalletFromChain) {
        throw new Error(
          `Mismatch between UserReplicaSetManager chain ownerWallet: ${ownerWalletFromChain} and queried ownerWallet: ${queriedOwnerWallet}`
        )
      }
      logger.info(`Found UserReplicaSetManager and Discovery Provider match for spID=${spID}, delegateWallet=${queriedDelegateOwnerWallet}`)

      /**
       * Query eth-contracts and confirm IDs
       */
      let ethSpInfo = await libs.getServiceEndpointInfo('content-node', spID)
      if (delegateWalletFromChain !== ethSpInfo.delegateOwnerWallet) {
        throw new Error(
          `Mismatch between UserReplicaSetManager chain delegateOwnerWallet: ${delegateWalletFromChain} and SP eth-contracts delegateOwnerWallet: ${ethSpInfo.delegateOwnerWallet}`
        )
      }
      if (ownerWalletFromChain !== ethSpInfo.owner) {
        throw new Error(
          `Mismatch between UserReplicaSetManager chain ownerWallet: ${ownerWalletFromChain} and SP eth-contracts ownerWallet: ${ethSpInfo.owner}`
        )
      }
      logger.info(`Found UserReplicaSetManager and ServiceProviderFactory match for spID=${spID}, delegateWallet=${delegateWalletFromChain}, ownerWallet=${ownerWalletFromChain}`)

      /**
       * Confirm nodes with spIDs 1-3 are correctly configured as bootstrappers and any additional nodes were registered with proposals from registered nodes
       */
      if (BOOTSTRAP_SP_IDS.has(spID)) {
        assert.ok(_.isEqual(queriedNodeInfo.proposer_sp_ids, [0, 0, 0]))
        assert.strictEqual(queriedNodeInfo.proposer_1_delegate_owner_wallet, ZERO_ADDRESS)
        assert.strictEqual(queriedNodeInfo.proposer_2_delegate_owner_wallet, ZERO_ADDRESS)
        assert.strictEqual(queriedNodeInfo.proposer_3_delegate_owner_wallet, ZERO_ADDRESS)
      } else {
        const proposerSpIDs = queriedNodeInfo.proposer_sp_ids
        for (const proposerSpID of proposerSpIDs) {
          const proposerNodeInfo = queriedContentNodesMap[proposerSpID]
          assert.ok(proposerNodeInfo !== null)
          assert.strictEqual(proposerSpID, proposerNodeInfo.cnode_sp_id)
        }
        assert.strictEqual(queriedNodeInfo.proposer_1_delegate_owner_wallet, queriedContentNodesMap[proposerSpIDs[0]].delegate_owner_wallet)
        assert.strictEqual(queriedNodeInfo.proposer_2_delegate_owner_wallet, queriedContentNodesMap[proposerSpIDs[1]].delegate_owner_wallet)
        assert.strictEqual(queriedNodeInfo.proposer_3_delegate_owner_wallet, queriedContentNodesMap[proposerSpIDs[2]].delegate_owner_wallet)
      }
    }))
  })

  logger.info(`Finished validating content-nodes on UserReplicaSetManager`)
}

const userReplicaSetManagerTest = async ({
  numUsers,
  executeAll,
  executeOne,
}) => {
  // Initialize content node info mapping
  contentNodeEndpointToInfoMapping = {}
  let contentNodeList = await executeOne(DEFAULT_INDEX, async (libsWrapper) => {
    let endpointsList = await libsWrapper.getServices('content-node') 
    return endpointsList
  })
  contentNodeList.forEach((info)=>{
      contentNodeEndpointToInfoMapping[info.endpoint] = info
  })

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

  await verifyUrsmContentNodes(executeOne)

  // Start of actual test logic
  await verifyUserReplicaSets(executeAll)
  await promoteSecondary1ToPrimary(executeAll)
  await verifyUserReplicaSets(executeAll)
  await promoteSecondary2ToPrimary(executeAll)
  await verifyUserReplicaSets(executeAll)
  await swapSecondaries(executeAll)
  await verifyUserReplicaSets(executeAll)
}

module.exports = {
  userReplicaSetManagerTest
}
