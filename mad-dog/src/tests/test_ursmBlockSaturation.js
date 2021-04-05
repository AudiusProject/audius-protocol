const axios = require('axios')

const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../logger.js')
const {
  addAndUpgradeUsers,
  genRandomUsers
} = require('../helpers.js')

const DEFAULT_INDEX = 0

let contentNodeEndpointToInfoMapping = {}
let walletIndexToUserIdMap

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

// Insert 2 records for a given user in a single block
// 3 Transactions total: 1 replica set update, 1 bio update, 1 name update
// UserFactory will reduce both txs into a single record
// UserRelicaSetManager will insert another record
// Calling this function 2x for a single user should result in 2 is_current=False records
//    for a single block on the second update
const submitParallelUserTxs = async(executeAll) => {
  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    const userId = walletIndexToUserIdMap[i]
    let sameBlockTxSubmitted = false
    // Array of block numbers
    let blockResponses = []
    while(!sameBlockTxSubmitted) {
        let usrReplicaInfoFromContract = await libs.getUserReplicaSet(userId)
        logger.info(`userId: ${userId}: submitParallelUserTxs`)
        let primary = usrReplicaInfoFromContract.primaryId
        let secondaries = usrReplicaInfoFromContract.secondaryIds
        let newPrimary = parseInt(secondaries[0])
        let newSecondaries = [primary, secondaries[1]].map(x=>parseInt(x))
        logger.info(`userId: ${userId} | P: ${primary}->${newPrimary}`)
        logger.info(`userId: ${userId} | S1: ${secondaries[0]}->${newSecondaries[0]}`)
        logger.info(`userId: ${userId} | S2: ${secondaries[1]}->${newSecondaries[1]}`)

        let randomUserInfo = genRandomUsers(1)[0]
        // Issue 3 concurrent update operations
        blockResponses = await Promise.all([
            (async () => {
                let tx = await libs.updateReplicaSet(userId, newPrimary, newSecondaries)
                console.log(`userId: ${userId} | Returning ${tx.blockNumber}`)
                return tx.blockNumber
            })(),
            (async () => {
                let bioTx = await libs.updateBio(userId, randomUserInfo.bio)
                console.log(`userId: ${userId} | Returning bioTx: ${bioTx.txReceipt.blockNumber}`)
                return bioTx.txReceipt.blockNumber
            })(),
            (async() => {
                let nameTx = await libs.updateBio(userId, randomUserInfo.name)
                console.log(`userId: ${userId} | Returning nameTx: ${nameTx.txReceipt.blockNumber}`)
                return nameTx.txReceipt.blockNumber
            })()
        ])
        sameBlockTxSubmitted = (
          (blockResponses[0] === blockResponses[1]) && (blockResponses[0] === blockResponses[2])
        )
        console.log(`userId: ${userId} | ${blockResponses}, sameBlockSubmitted=${sameBlockTxSubmitted}`)
    }
    console.log(`userId:${userId} | Submitted same blockNumber for 3 user operations + user replica set: ${blockResponses[0]}`)
    if (blockResponses.length < 3) {
      throw new Error(`Missing blockNumber response: ${blockResponses}`)
    }

    // Confirm that the block where all 3 txs were submitted in gets processed
    await waitForBlock(libs, blockResponses[0])
  })
}

// Verify indexed state matches content nodes registered in UserReplicaSetManager
// Also confirms UserReplicaSetManager state maches eth-contracts
const userReplicaSetBlockSaturationTest = async ({
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

  // Submit parallel updates, resulting in 2 User records
  // record2 = block x, is_current=True
  // record1 = block x, is_current=False
  await submitParallelUserTxs(executeAll)

  // Submit parallel updates again, resulting in 2 user records with identical
  //    blockNumber and is_current=False
  // record4 = block y, is_current=True
  // record3 = block y, is_current=False
  // record2 = block x, is_current=False
  // record1 = block x, is_current=False
  await submitParallelUserTxs(executeAll)
}

module.exports = {
  userReplicaSetBlockSaturationTest
}
