const {
  OPERATION_TYPE,
  TrackUploadRequest,
  TrackUploadResponse
} = require('../operations.js')

const path = require('path')
const { _ } = require('lodash')
const fs = require('fs-extra')

const { logger } = require('../logger.js')
const ServiceCommands = require('@audius/service-commands')
const MadDog = require('../madDog.js')
const { EmitterBasedTest, Event } = require('../emitter.js')
const { addAndUpgradeUsers, getRandomTrackMetadata, getRandomTrackFilePath } = require('../helpers.js')
const {
  uploadTrack,
  getTrackMetadata,
  getUser,
  verifyCIDExistsOnCreatorNode
} = ServiceCommands

// NOTE - # of ticks = (TEST_DURATION_SECONDS / TICK_INTERVAL_SECONDS) - 1
const TICK_INTERVAL_SECONDS = 5
const TEST_DURATION_SECONDS = 10
const TEMP_STORAGE_PATH = path.resolve('./local-storage/tmp/')

/**
 * Randomly uploads tracks over the duration of the test,
 * testing that the CIDs are on the respective CNodes at the end of the test.
 */
module.exports = consistency1 = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes,
  enableFaultInjection
}) => {
  // Begin: Test Setup
  
  // create tmp storage dir
  await fs.ensureDir(TEMP_STORAGE_PATH)

  // map of walletId => trackId => metadata
  const walletTrackMap = {}
  // map of walletId => trackId => metadata
  const failedUploads = {}

  // Create the Emitter Based Test
  const emitterTest = new EmitterBasedTest({
    tickIntervalSeconds: TICK_INTERVAL_SECONDS,
    testDurationSeconds: TEST_DURATION_SECONDS
  })

  // Register the request listener. The only request type this test
  // currently handles is to upload tracks.
  emitterTest.registerOnRequestListener(async (request, emit) => {
    const { type, walletIndex, userId } = request
    switch (type) {
      case OPERATION_TYPE.TRACK_UPLOAD: {
        const track = getRandomTrackMetadata(userId)

        const randomTrackFilePath = await getRandomTrackFilePath(TEMP_STORAGE_PATH)

        let res
        try {
          // Execute a track upload request against a single
          // instance of libs.
          const trackId = await executeOne(walletIndex, l =>
            uploadTrack(l, track, randomTrackFilePath)
          )
          res = new TrackUploadResponse(walletIndex, trackId, track)
        } catch (e) {
          logger.warn(`Caught error [${e.message}] uploading track: [${track}]`)
          res = new TrackUploadResponse(
            walletIndex,
            null,
            track,
            false,
            e.message
          )
        }
        // Emit the response event
        emit(Event.RESPONSE, res)
        break
      }
      default:
        logger.error('Unknown request type!')
        break
    }
  })

  // Register the response listener. Currently only handles
  // track upload responses.
  emitterTest.registerOnResponseListener(res => {
    switch (res.type) {
      case OPERATION_TYPE.TRACK_UPLOAD: {
        const { walletIndex, trackId, metadata, success } = res
        // If it failed, log it
        if (!success) {
          if (!failedUploads[walletIndex]) {
            failedUploads[walletIndex] = {}
          }

          failedUploads[walletIndex] = {
            [trackId]: metadata
          }
        } else {
          if (!walletTrackMap[walletIndex]) {
            walletTrackMap[walletIndex] = {}
          }

          walletTrackMap[walletIndex] = {
            [trackId]: metadata
          }
        }
        break
      }
      default:
        logger.error('Unknown response type')
    }
  })

  // Emit one track upload request per tick. This can be adapted to emit other kinds
  // of events.
  emitterTest.registerOnTickListener(emit => {
    const requesterIdx = _.random(0, numUsers - 1)
    const request = new TrackUploadRequest(
      requesterIdx,
      walletIdMap[requesterIdx]
    )
    emit(Event.REQUEST, request)
  })

  // Create users, upgrade them to creators
  const walletIdMap = await addAndUpgradeUsers(
    numUsers,
    numCreatorNodes,
    executeAll,
    executeOne
  )

  if (enableFaultInjection) {
    // Create a MadDog instance, responsible for taking down nodes
    const m = new MadDog(numCreatorNodes)
    m.start()
  }

  // Start the test, wait for it to finish.
  await emitterTest.start()
  logger.info('Emitter test exited')

  // Verify results

  // create array of track upload info to verify
  const trackUploadInfo = []
  for (const walletIndex of Object.keys(walletTrackMap)) {
    const userId = walletIdMap[walletIndex]
    const tracks = walletTrackMap[walletIndex]
    if (!tracks) continue
    for (const trackId of Object.keys(tracks)) {
      trackUploadInfo.push({
        walletIndex,
        trackId,
        userId
      })
    }
  }

  const allCIDsExistOnCNodes = await verifyAllCIDsExistOnCNodes(trackUploadInfo, executeOne)
  if (!allCIDsExistOnCNodes) {
    return { error: 'Not all CIDs exist on creator nodes.' }
  }
  const failedWallets = Object.values(failedUploads)
  if (failedWallets.length) {
    logger.info({ failedWallets, failedUploads })
    const userIds = failedWallets.map(w => walletIdMap[w])
    logger.warn(`Uploads failed for user IDs: [${userIds}]`)
  }

  // Remove temp storage dir
  await fs.remove(TEMP_STORAGE_PATH)

  return {}
}

/**
 * Expects trackUploads in the shape of Array<{ userId, walletIndex, trackId }>
 */
const verifyAllCIDsExistOnCNodes = async (trackUploads, executeOne) => {
  // map userId => CID[]
  const userCIDMap = {}
  for (const { trackId, walletIndex, userId } of trackUploads) {
    const trackMetadata = await executeOne(walletIndex, l =>
      getTrackMetadata(l, trackId)
    )
    const segmentCIDs = trackMetadata.track_segments.map(s => s.multihash)
    if (userCIDMap[userId] === undefined) {
      userCIDMap[userId] = []
    }
    userCIDMap[userId] = [...userCIDMap[userId], ...segmentCIDs]
  }

  // Now, find the cnodes for each user

  // make a map of userID => array of cnode endpoints in user replica set
  const userIdRSetMap = {}
  const userIds = trackUploads.map(u => u.userId)
  for (const userId of userIds) {
    const user = await executeOne(0, l => getUser(l, userId))
    userIdRSetMap[userId] = user.creator_node_endpoint.split(",")
  }

  // Now, confirm each of these CIDs are on the file
  // system of the user's primary CNode.
  // TODO - currently only verifies CID on user's primary, need to add verification
  //    against secondaries as well. This is difficult because of sync non-determinism + time lag.
  const failedCIDs = []
  for (const userId of userIds) {
    const userRSet = userIdRSetMap[userId]
    const endpoint = userRSet[0]
    const cids = userCIDMap[userId]

    if (!cids) continue
    for (const cid of cids) {
      logger.info(`Verifying CID ${cid} for userID ${userId} on primary: [${endpoint}]`)
      
      // TODO: add `fromFS` option when this is merged back into CN.
      const exists = await verifyCIDExistsOnCreatorNode(cid, endpoint)
      
      logger.info(`Verified CID ${cid} for userID ${userId} on primary: [${endpoint}]!`)
      if (!exists) {
        logger.warn('Found a non-existent cid!')
        failedCIDs.push(cid)
      }
    }
  }
  logger.info('Completed verifying CIDs')
  return !failedCIDs.length
}
