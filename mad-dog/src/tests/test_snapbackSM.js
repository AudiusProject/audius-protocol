const path = require('path')
const axios = require('axios')
const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../logger.js')
const {
  addAndUpgradeUsers,
  getRandomTrackMetadata,
  getRandomTrackFilePath,
  ensureReplicaSetSyncIsConsistent
} = require('../helpers.js')
const {
  uploadTrack
} = ServiceCommands

const TEMP_STORAGE_PATH = path.resolve('./local-storage/tmp/')
let walletIndexToUserIdMap

// Monitor ALL users until completed
const monitorAllUsersSyncStatus = async ({ executeAll, executeOne }) => {
  await executeAll(async (libs, i) => {
    await ensureReplicaSetSyncIsConsistent({ i, libs, executeOne })
  })
}

const snapbackSMParallelSyncTest = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes
}) => {
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

  // Issue parallel uploads for all users
  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    // NOTE - It might be easier to just create a map of wallets instead of using 'index'
    const userId = walletIndexToUserIdMap[i]
    const newTrackMetadata = getRandomTrackMetadata(userId)
    const randomTrackFilePath = await getRandomTrackFilePath(TEMP_STORAGE_PATH)
    logger.info(
      `Uploading Track for userId:${userId} (${libs.walletAddress}), ${randomTrackFilePath}, ${JSON.stringify(newTrackMetadata)}`
    )
    try {
      const startTime = Date.now()
      const trackId = await executeOne(i, (l) =>
        uploadTrack(
          l,
          newTrackMetadata,
          randomTrackFilePath
        )
      )
      const duration = Date.now() - startTime
      logger.info(`Uploaded track for userId=${userId}, trackId=${trackId} in ${duration}ms`)
    } catch (e) {
      logger.error(`Error uploading track for userId:${userId} :${e}`)
    }
  })

  // Validate all syncs complete before exiting
  await monitorAllUsersSyncStatus({ executeAll, executeOne })
}

module.exports = {
  snapbackSMParallelSyncTest
}
