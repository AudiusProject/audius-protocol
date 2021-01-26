const path = require('path')
const axios = require('axios')
const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../logger.js')
const {
  addAndUpgradeUsers
} = require('../helpers.js')

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

const userReplicaSetManagerTest = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
  contentNodeEndpointToInfoMapping = {}

  console.log(executeAll)
  // Initialize users
  if (!walletIndexToUserIdMap) {
    try {
      console.log('here1')
      walletIndexToUserIdMap = await addAndUpgradeUsers(
        numUsers,
        numCreatorNodes,
        executeAll,
        executeOne
      )
    } catch (e) {
      return { error: `Issue with creating and upgrading users: ${e}` }
    }
  }
  console.log('here2')

  let contentNodeList = await executeOne(DEFAULT_INDEX, async (libsWrapper) => {
    console.log('Executing one!')
    //   console.log(libsWrapper)
    let endpointsList = await libsWrapper.getServices('content-node') 
    return endpointsList
  })
  contentNodeList.forEach((info)=>{
      contentNodeEndpointToInfoMapping[info.endpoint] = info
  })
  console.log(contentNodeEndpointToInfoMapping)
  /*

  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    // NOTE - It might be easier to just create a map of wallets instead of using 'index'
    const userId = walletIndexToUserIdMap[i]
    try {
        // Query user object
        console.log(`Validating user: ${userId}`)
        let userObject = await getUser(libs, i)
        console.log(userObject)
    } catch (e) {
      logger.error(`Error uploading track for userId:${userId} :${e}`)
    }
  })
  */
}

module.exports = {
  userReplicaSetManagerTest
}
