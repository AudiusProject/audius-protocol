const {
  OPERATION_TYPE,
  TrackUploadRequest,
  TrackUploadResponse
} = require('../operations.js')

const path = require('path')
const axios = require('axios')
const { _ } = require('lodash')
const fs = require('fs-extra')

const { logger } = require('../logger.js')
const ServiceCommands = require('@audius/service-commands')
const MadDog = require('../madDog.js')
const { EmitterBasedTest, Event } = require('../emitter.js')
const { addAndUpgradeUsers, getRandomTrackMetadata, getRandomTrackFilePath, delay } = require('../helpers.js')
const {
  uploadTrack,
  getTrackMetadata,
  getUser,
  verifyCIDExistsOnCreatorNode,
  setCreatorNodeEndpoint,
  updateCreator
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
  let walletIdMap
  try {
    walletIdMap = await addAndUpgradeUsers(
      numUsers,
      numCreatorNodes,
      executeAll,
      executeOne
    )
  } catch (e) {
    return { error: `Issue with creating and upgrading users: ${e}` }
  }

  if (enableFaultInjection) {
    // Create a MadDog instance, responsible for taking down nodes
    const m = new MadDog(numCreatorNodes)
    m.start()
  }

  // Start the test, wait for it to finish.
  await emitterTest.start()
  logger.info('Emitter test exited')

  /**
   * Verify results
   */

  // Check all user replicas until they are synced up to primary
  await ensureSecondariesAreUpToDate({walletIdMap, executeOne})

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

  // Ensure all CIDs exist on every replica
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

  // Switch user primary (above tests have already confirmed all secondaries have latest state)
  for await (const walletIndex of Object.keys(walletIdMap)) {
    const userId = walletIdMap[walletIndex]
    const userMetadata = await executeOne(walletIndex, l => getUser(l, userId))
    const wallet = userMetadata.wallet
    const [primary, ...secondaries] = userMetadata.creator_node_endpoint.split(',')

    logger.info(`userId ${userId} wallet ${wallet} rset ${userMetadata.creator_node_endpoint}`)

    // Define new rset
    const newRSet = (secondaries.length) ? [secondaries[0], primary].concat(secondaries.slice(1)) : [primary]

    // Update libs instance with new endpoint
    await executeOne(walletIndex, libs => setCreatorNodeEndpoint(libs, newRSet[0]))

    // Update user metadata obj
    const newMetadata = { ...userMetadata }
    newMetadata.creator_node_endpoint = newRSet.join(',')

    // Update creator state on CN and chain
    await executeOne(walletIndex, libs => updateCreator(libs, userId, newMetadata))

    logger.info(`Successfully updated creator with id ${userId} on CN and Chain`)
  }

  // Check all user replicas until they are synced up to primary
  await ensureSecondariesAreUpToDate({walletIdMap, executeOne})

  // TODO Upload more content to new primary + verify

  // Remove temp storage dir
  await fs.remove(TEMP_STORAGE_PATH)

  return {}
}

const ensureSecondariesAreUpToDate = async ({walletIdMap, executeOne}) => {
  await Promise.all(Object.keys(walletIdMap).map(async (walletIndex) => {
    const userId = walletIdMap[walletIndex]
    const user = await executeOne(0, l => getUser(l, userId))
    const wallet = user.wallet

    logger.info(`Validating replica set sync statuses for userId ${userId}...`)
    
    const [primary, ...secondaries] = user.creator_node_endpoint.split(',')
    const primClock = await getUserClockValueFromNode(wallet, primary)

    await Promise.all(secondaries.map(async (secondary) => {
      let retryCount = 0
      const retryLimit = 10
      let retryInterval = 2000
      let synced = false

      while (!synced) {
        if (retryCount === retryLimit) {
          throw new Error(`Secondary ${secondary} for userId ${userId} failed to sync.`)
        }

        const secClock = await getUserClockValueFromNode(wallet, secondary)
        if (secClock === primClock) {
          synced = true
        } else {
          await delay(retryInterval)
          retryCount++
        }
      }
      logger.info(`userId ${userId} secondary ${secondary} synced up to primary ${primary} at clock ${primClock} after ${retryCount * retryInterval}ms`)
    }))
  }))
}

// Retrieve the current clock value on a node
const getUserClockValueFromNode = async (wallet, endpoint) => {
  let resp = await axios({
    method: 'get',
    baseURL: endpoint,
    url: `/users/clock_status/${wallet}`
  })
  return resp.data.clockValue
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
    userIdRSetMap[userId] = user.creator_node_endpoint.split(',')
  }

  // Now, confirm each of these CIDs are available on each user replica
  const failedCIDs = []
  for (const userId of userIds) {
    const userRSet = userIdRSetMap[userId]
    const cids = userCIDMap[userId]

    if (!cids) continue

    await Promise.all(cids.map(async (cid) => {
      await Promise.all(userRSet.map(async (replica) => {

        // TODO: add `fromFS` option when this is merged back into CN.
        const exists = await verifyCIDExistsOnCreatorNode(cid, replica)

        logger.info(`Verified CID ${cid} for userID ${userId} on replica [${replica}]!`)
        if (!exists) {
          logger.warn(`Could not find CID ${cid} for userID ${userId} on replica ${replica}`)
          failedCIDs.push(cid)
        }
      }))
    }))
  }
  logger.info('Completed verifying CIDs')
  return !failedCIDs.length
}
