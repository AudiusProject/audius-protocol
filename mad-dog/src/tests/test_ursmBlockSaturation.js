const axios = require('axios')
const assert = require('assert')
const _ = require('lodash')

const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../logger.js')
const {
  addAndUpgradeUsers,
  genRandomUsers
} = require('../helpers.js')

const DEFAULT_INDEX = 1
const BOOTSTRAP_SP_IDS = new Set([1,2,3])
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

let contentNodeEndpointToInfoMapping = {}
let walletIndexToUserIdMap

const {
    getUser
} = ServiceCommands

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

// Promote each user's secondary1 to primary
// Replica set transitions: (P=Primary, S1=Secondary1, S2 = Secondary2)
// P->S1, S1->P, S2->S2
const promoteSecondary1ToPrimary = async(executeAll) => {
  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    const userId = walletIndexToUserIdMap[i]
    let sameBlockTxSubmitted = false
    // Array of block numbers
    let blockResponses = []
    while(!sameBlockTxSubmitted) {
        let usrReplicaInfoFromContract = await libs.getUserReplicaSet(userId)
        logger.info(`userId: ${userId}: promoteSecondary1ToPrimary`)
        let primary = usrReplicaInfoFromContract.primaryId
        let secondaries = usrReplicaInfoFromContract.secondaryIds
        let newPrimary = parseInt(secondaries[0])
        let newSecondaries = [primary, secondaries[1]].map(x=>parseInt(x))
        logger.info(`userId: ${userId} | P: ${primary}->${newPrimary}`)
        logger.info(`userId: ${userId} | S1: ${secondaries[0]}->${newSecondaries[0]}`)
        logger.info(`userId: ${userId} | S2: ${secondaries[1]}->${newSecondaries[1]}`)

        let randomUserInfo = genRandomUsers(1)[0]
        console.log(randomUserInfo)
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
        console.log(`userId: ${userId} | ${blockResponses}`)
        sameBlockTxSubmitted = blockResponses[0] === blockResponses[1] === blockResponses[2]
    }
    console.log(`userId:${userId} | Submitted same blockNumber for 3 user operations + user replica set: ${blockResponses[0]}`)
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

  await promoteSecondary1ToPrimary(executeAll)
}

module.exports = {
  userReplicaSetBlockSaturationTest
}
