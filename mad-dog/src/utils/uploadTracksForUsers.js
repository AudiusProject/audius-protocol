const path = require('path')
const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../logger.js')
const {
  getRandomTrackMetadata,
  getRandomTrackFilePath
} = require('../helpers.js')
const {
  uploadTrack
} = ServiceCommands

const TEMP_STORAGE_PATH = path.resolve('./local-storage/tmp/')

const uploadTracksforUsers = async ({
  executeAll,
  executeOne,
  walletIndexToUserIdMap
}) => {
  // Issue parallel uploads for all users
  const trackIds = await executeAll(async (libs, i) => {
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
      return trackId
    } catch (e) {
      logger.error(`Error uploading track for userId:${userId} :${e}`)
    }
  })
  return trackIds
}

module.exports.uploadTracksforUsers = uploadTracksforUsers
