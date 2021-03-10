const path = require('path')
const axios = require('axios')
const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../logger.js')
const {
  addAndUpgradeUsers,
  getRandomTrackMetadata,
  getRandomTrackFilePath,
  delay
} = require('../helpers.js')
const {
  uploadTrack,
  getUser
} = ServiceCommands

const TEMP_STORAGE_PATH = path.resolve('./local-storage/tmp/')
let walletIndexToUserIdMap

// Retrieve the current clock value on a node
const getUserClockValueFromNode = async (wallet, endpoint) => {
  const resp = await axios({
    method: 'get',
    baseURL: endpoint,
    url: `/users/clock_status/${wallet}`
  })
  return resp.data.clockValue
}

// Monitor ALL users until completed
// TODO: Maximum timeout?
const monitorAllUsersSyncStatus = async ({ executeAll }) => {
  await executeAll(async (libs, i) => {
    const userId = walletIndexToUserIdMap[i]
    const userInfo = await getUser(libs, userId)
    const endpoints = userInfo.creator_node_endpoint.split(',')
    const userWallet = userInfo.wallet
    const primary = endpoints[0]
    const secondary1 = endpoints[1]
    const secondary2 = endpoints[2]
    logger.info(`Monitoring sync status for ${userId}, ${primary},${secondary1},${secondary2}`)
    let primaryClockValue, secondary1ClockValue, secondary2ClockValue
    let synced = false
    while (!synced) {
      try {
        primaryClockValue = await getUserClockValueFromNode(userWallet, primary)
        secondary1ClockValue = await getUserClockValueFromNode(userWallet, secondary1)
        secondary2ClockValue = await getUserClockValueFromNode(userWallet, secondary2)
        logger.info(`Monitoring sync for ${userId} | ${primary}:${primaryClockValue} - ${secondary1}:${secondary1ClockValue} - ${secondary2}:${secondary2ClockValue}`)

        if (secondary1ClockValue === primaryClockValue && secondary2ClockValue && primaryClockValue) {
          synced = true
          logger.info(`Sync completed for user=${userId}!`)
        }
      } catch (e) {
        logger.info(e)
        throw new Error(`Failed sync monitoring for ${userId}`)
      }
      if (!synced) {
        // Wait 1s
        await delay(1000)
      }
    }
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

  // // Issue parallel uploads for all users
  // await executeAll(async (libs, i) => {
  //   // Retrieve user id if known from walletIndexToUserIdMap
  //   // NOTE - It might be easier to just create a map of wallets instead of using 'index'
  //   const userId = walletIndexToUserIdMap[i]
  //   const newTrackMetadata = getRandomTrackMetadata(userId)
  //   const randomTrackFilePath = await getRandomTrackFilePath(TEMP_STORAGE_PATH)
  //   logger.info(
  //     `Uploading Track for userId:${userId} (${libs.walletAddress}), ${randomTrackFilePath}, ${JSON.stringify(newTrackMetadata)}`
  //   )
  //   try {
  //     const startTime = Date.now()
  //     const trackId = await executeOne(i, (l) =>
  //       uploadTrack(
  //         l,
  //         newTrackMetadata,
  //         randomTrackFilePath
  //       )
  //     )
  //     const duration = Date.now() - startTime
  //     logger.info(`Uploaded track for userId=${userId}, trackId=${trackId} in ${duration}ms`)
  //   } catch (e) {
  //     logger.error(`Error uploading track for userId:${userId} :${e}`)
  //   }
  // })

  // // Validate all syncs complete before exiting
  // await monitorAllUsersSyncStatus({ executeAll })
}

module.exports = {
  snapbackSMParallelSyncTest
}
