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

  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    // NOTE - It might be easier to just create a map of wallets instead of using 'index'
    const userId = walletIndexToUserIdMap[i]
    try {
        // Query user object
        let userObject = await getUser(libs, i)

        // Deconstruct the comma separated value of enpdoint1,endoint2,endpoint3
        let replicaEndpointArray = userObject.creator_node_endpoint.split(",")
        let primaryEndpointString = replicaEndpointArray[0]
        let secondaryEndpointStrings = replicaEndpointArray.slice(1)

        let primaryInfo = contentNodeEndpointToInfoMapping[primaryEndpointString]

        let primaryId = userObject.primary

        // Throw if mismatched
        if (primaryId !== primaryInfo.spID) {
          throw new Error(`Mismatch spID values. Expected endpoint for ${primaryId}, found ${primaryInfo.spID}`)
        }
        console.log(`userId: ${userId} primaryId: ${primaryId} primaryIdFromEndointStr: ${primaryInfo.spID}`)

        // Throw if array lengths do not match for secondaries
        if (secondaryEndpointStrings.length !== userObject.secondaries.length) {
          throw new Error('Mismatched secondary status')
        }

        // Compare secondary replica ID values to secondary endpoints in 
        //    legacy comma separated strings
        for (var i = 0; i < userObject.secondaries.length; i++) {
          let secondaryId = userObject.secondaries[i]
          let secondaryEndpoint = secondaryEndpointStrings[i]
          let secondaryInfoFromStr = contentNodeEndpointToInfoMapping[secondaryEndpoint]
          let secondaryIdFromStr = secondaryInfoFromStr.spID
          console.log(`userId: ${userId} secondaryId: ${secondaryId} secondaryIdFromEndpointStr: ${secondaryIdFromStr}`)

          // Throw if the ID array does not match the endpoint in the 
          //  comma separated string
          if (secondaryId !== secondaryIdFromStr) {
            throw new Error("Invalid write operation")
          }
        }

    } catch (e) {
      logger.error(`Error validating userId:${userId} :${e}`)
    }
  })
}

module.exports = {
  userReplicaSetManagerTest
}
