const path = require('path')
const { _ } = require('lodash')
const fs = require('fs-extra')
const axios = require('axios')
const retry = require('async-retry')
const assert = require('assert')
const ServiceCommands = require('@audius/service-commands')
const { getContentNodeEndpoints, getRepostersForTrack, createPlaylist, getPlaylists } = require('@audius/service-commands')

const {
  OPERATION_TYPE,
  TrackUploadRequest,
  TrackUploadResponse,
  TrackRepostRequest,
  TrackRepostResponse,
  AddPlaylistTrackRequest,
  AddPlaylistTrackResponse,
  CreatePlaylistRequest,
  CreatePlaylistResponse
} = require('../operations.js')
const { logger } = require('../logger.js')
const MadDog = require('../madDog.js')
const { EmitterBasedTest, Event } = require('../emitter.js')
const {
  getRandomTrackMetadata,
  getRandomTrackFilePath,
  addUsers,
  r6,
  ensureReplicaSetSyncIsConsistent,
  upgradeUsersToCreators,
  delay,
  genRandomString
} = require('../helpers.js')
const {
  uploadTrack,
  repostTrack,
  getTrackMetadata,
  getUser,
  getUsers,
  verifyCIDExistsOnCreatorNode,
  uploadPhotoAndUpdateMetadata,
  setCreatorNodeEndpoint,
  updateCreator,
  getURSMContentNodes,
  addPlaylistTrack
} = ServiceCommands

// NOTE - # of ticks = (TEST_DURATION_SECONDS / TICK_INTERVAL_SECONDS) - 1
const TICK_INTERVAL_SECONDS = 5
const TEST_DURATION_SECONDS = 100
const TEMP_STORAGE_PATH = path.resolve('./local-storage/tmp/')
const TEMP_IMG_STORAGE_PATH = path.resolve('./local-storage/tmp-imgs/')

const SECOND_USER_PIC_PATH = path.resolve('assets/images/duck.jpg')
const THIRD_USER_PIC_PATH = path.resolve('assets/images/sid.png')
const repostedTracks = []
const uploadedTracks = []
const userRepostedMap = {}
const createdPlaylists = []
const addedPlaylistTracks = []

/**
 * Randomly uploads tracks over the duration of the test,
 * testing that the CIDs are on the respective CNodes at the end of the test.
 */
module.exports = coreIntegration = async ({
  numUsers,
  executeAll,
  executeOne,
  numCreatorNodes,
  enableFaultInjection
}) => {
  // Begin: Test Setup

  // If running with UserReplicaSetManager deployed, wait until all Content Nodes are registered on it
  const URSMClient = await executeOne(0, libs => libs.libsInstance.contracts.UserReplicaSetManagerClient)
  if (URSMClient) {
    let retryCount = 0
    const retryLimit = 10
    const retryIntervalMs = 10000 // 10sec
    while (true) {
      console.log(`Ensuring correct URSM state with interval ${retryIntervalMs} || attempt #${retryCount} ...`)

      const URSMContentNodes = await executeOne(0, libs => getURSMContentNodes(libs))

      if (URSMContentNodes.length === numCreatorNodes) {
        break
      }

      if (retryCount >= retryLimit) {
        return { error: `URSM state not correctly initialized after ${retryIntervalMs * retryLimit}ms` }
      }

      retryCount++

      await delay(retryIntervalMs)
    }
  }

  // create tmp storage dir
  await fs.ensureDir(TEMP_STORAGE_PATH)
  await fs.ensureDir(TEMP_IMG_STORAGE_PATH)

  // map of walletId => trackId => metadata
  const walletTrackMap = {}
  // map of walletId => trackId => metadata
  const failedUploads = {}

  // Create the Emitter Based Test
  const emitterTest = new EmitterBasedTest({
    tickIntervalSeconds: TICK_INTERVAL_SECONDS,
    testDurationSeconds: TEST_DURATION_SECONDS
  })

  const tracksAttemptedRepost = []

  // Register the request listener. The only request type this test
  // currently handles is to upload tracks.
  emitterTest.registerOnRequestListener(async (request, emit) => {
    const { type, walletIndex, userId } = request
    let res
    switch (type) {
      case OPERATION_TYPE.TRACK_UPLOAD: {
        const track = getRandomTrackMetadata(userId)

        const randomTrackFilePath = await getRandomTrackFilePath(TEMP_STORAGE_PATH)

        try {
          // Execute a track upload request against a single
          // instance of libs.
          await executeOne(walletIndex, l => l.waitForLatestBlock())
          const trackId = await executeOne(walletIndex, l =>
            uploadTrack(l, track, randomTrackFilePath)
          )
          uploadedTracks.push({ trackId: trackId, userId: userId })
          res = new TrackUploadResponse(walletIndex, trackId, track)
        } catch (e) {
          logger.error(`Caught error [${e.message}] uploading track: [${JSON.stringify(track)}]\n${e.stack}`)
          res = new TrackUploadResponse(
            walletIndex,
            null,
            track,
            false,
            e.message
          )
          throw new Error(e)
        }
        // Emit the response event
        emit(Event.RESPONSE, res)
        break
      }
      case OPERATION_TYPE.TRACK_REPOST: {
        // repost candidates include tracks from other users that have not already been reposted by current user
        const repostCandidates = uploadedTracks
          .filter(obj => obj.userId !== userId)
          .filter(obj => {
            if (!userRepostedMap[obj.userId]) {
              return true
            }
            return !userRepostedMap[obj.userId].includes(obj.trackId)
          })
          .map(obj => obj.trackId)
        if (repostCandidates.length === 0) {
          const missingTrackMessage = 'No tracks available to repost'
          logger.info(missingTrackMessage)
          res = new TrackRepostResponse(walletIndex, null, userId, false)
        } else {
          const trackId = repostCandidates[_.random(repostCandidates.length - 1)]
          try {
            tracksAttemptedRepost.push(trackId)
            await executeOne(walletIndex, l => {
              repostTrack(l, trackId)
            })
            await executeOne(walletIndex, l => l.waitForLatestBlock())

            // verify repost
            await retry(async () => {
              const reposters = await executeOne(0, l => getRepostersForTrack(l, trackId))
              const usersReposted = reposters.map(obj => obj.user_id)
              if (!usersReposted.includes(userId)) {
                throw new Error(`Reposters for track [${trackId}] do not include user [${userId}]`)
              }
            }, {
              retries: 20,
              factor: 2
            })

            res = new TrackRepostResponse(walletIndex, trackId, userId)
          } catch (e) {
            logger.error(`Caught error [${e.message}] reposting track: [${trackId}]\n${e.stack}`)
            res = new TrackRepostResponse(
              walletIndex,
              trackId,
              userId,
              false,
              e.message
            )
            throw new Error(e)
          }
        }
        // Emit the response event
        emit(Event.RESPONSE, res)
        break
      }
      case OPERATION_TYPE.CREATE_PLAYLIST: {
        try {
          // create playlist
          const randomPlaylistName = genRandomString(8)
          const playlist = await executeOne(walletIndex, l =>
            createPlaylist(l, userId, randomPlaylistName, false, false, [])
          )
          logger.info(`User [${userId}] created playlist [${playlist.playlistId}].`)
          await executeOne(walletIndex, l => l.waitForLatestBlock())

          // verify playlist
          const verifiedPlaylist = await executeOne(walletIndex, l =>
            getPlaylists(l, 100, 0, [playlist.playlistId], userId)
          )
          if (verifiedPlaylist[0].playlist_id !== playlist.playlistId) {
            throw new Error(`Error verifying playlist [${playlist.playlistId}]`)
          }

          res = new CreatePlaylistResponse(walletIndex, playlist.playlistId, userId)
        } catch (e) {
          logger.error(`Caught error [${e.message}] creating playlist.\n${e.stack}`)
          res = new CreatePlaylistResponse(walletIndex, null, userId)
          throw new Error(e)
        }
        emit(Event.RESPONSE, res)
        break
      }
      case OPERATION_TYPE.ADD_PLAYLIST_TRACK: {
        if (uploadedTracks.length === 0 || !createdPlaylists[userId]) {
          res = new AddPlaylistTrackResponse(
            walletIndex,
            null,
            false,
            new Error('Adding a track to a playlist requires a track to be uploaded.')
          )
        } else {
          const trackId = uploadedTracks[_.random(uploadedTracks.length - 1)].trackId
          try {
            // add track to playlist
            const playlistId = createdPlaylists[userId][_.random(createdPlaylists[userId].length - 1)]
            await executeOne(walletIndex, l =>
              addPlaylistTrack(l, playlistId, trackId)
            )
            logger.info(`Track [${trackId}] added to playlist [${playlistId}].`)
            await executeOne(walletIndex, l => l.waitForLatestBlock())

            // verify playlist track add
            await retry(async () => {
              const playlists = await executeOne(walletIndex, l =>
                getPlaylists(l, 100, 0, [playlistId], userId)
              )
              const playlistTracks = playlists[0].playlist_contents.track_ids.map(obj => obj.track)
              if (!playlistTracks.includes(trackId)) {
                throw new Error(`Track [${trackId}] not found in playlist [${playlistId}]`)
              }
            }, {
              retries: 20,
              factor: 2
            })
            res = new AddPlaylistTrackResponse(walletIndex, trackId)
          } catch (e) {
            logger.error(`Caught error [${e.message}] adding track: [${trackId}] to playlist \n${e.stack}`)
            res = new AddPlaylistTrackResponse(
              walletIndex,
              null,
              false,
              e.message
            )
            throw new Error(e)
          }
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
            walletTrackMap[walletIndex] = []
          }
          if (trackId) { // only add successfully uploaded tracks
            walletTrackMap[walletIndex].push(trackId)
          }
        }
        break
      }
      case OPERATION_TYPE.TRACK_REPOST: {
        const { walletIndex, trackId, userId, success } = res
        if (success) {
          repostedTracks.push({ trackId: trackId, userId: userId })
        }
        if (!userRepostedMap[userId]) {
          userRepostedMap[userId] = []
        }
        userRepostedMap[userId].push(trackId)
        break
      }
      case OPERATION_TYPE.CREATE_PLAYLIST: {
        const { walletIndex, playlist, userId, success } = res
        if (success) {
          if (!createdPlaylists[userId]) {
            createdPlaylists[userId] = []
          }
          createdPlaylists[userId].push(playlist)
        }
        break
      }
      case OPERATION_TYPE.ADD_PLAYLIST_TRACK: {
        const { walletIndex, trackId, success } = res
        if (success) {
          addedPlaylistTracks.push(trackId)
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
    const trackUploadRequest = new TrackUploadRequest(
      requesterIdx,
      walletIdMap[requesterIdx]
    )
    const trackRepostRequest = new TrackRepostRequest(
      requesterIdx,
      walletIdMap[requesterIdx]
    )
    const createPlaylistRequest = new CreatePlaylistRequest(
      requesterIdx,
      walletIdMap[requesterIdx]
    )
    const addPlaylistTrackRequest = new AddPlaylistTrackRequest(
      requesterIdx,
      walletIdMap[requesterIdx]
    )
    const requests = [trackUploadRequest, trackRepostRequest, createPlaylistRequest, addPlaylistTrackRequest]
    for (const request of requests) {
      const randomEmit = _.random(1)
      if (randomEmit) {
        emit(Event.REQUEST, request)
      }
    }
  })

  // Create users. Upgrade them to creators later
  let walletIdMap
  try {
    walletIdMap = await addUsers(
      numUsers,
      executeAll,
      executeOne
    )
  } catch (e) {
    return { error: `Issue with creating users: ${e}` }
  }

  // Check that users on signup have the proper metadata
  const walletIndexes = Object.keys(walletIdMap)
  const userIds = Object.values(walletIdMap)

  let userMetadatas = await executeOne(walletIndexes[0], libsWrapper => {
    return getUsers(libsWrapper, userIds)
  })

  // Check that certain MD fields in disc prov are what we expected it to be
  userMetadatas.forEach(user => {
    logger.info(`Checking initial metadata on signup for user=${user.user_id}...`)
    if (user.is_creator) {
      return {
        error: `New user ${user.user_id} should not be a creator immediately after sign-up.`
      }
    }

    // make this if case stronger -- like query cn1-3 to make sure that data is there
    if (!user.creator_node_endpoint) {
      return {
        error: `New user ${user.user_id} should have been assigned a replica set.`
      }
    }

    if (!user.profile_picture_sizes) {
      return {
        error: `New user ${user.user_id} should have an updated profile picture.`
      }
    }
  })

  // Check user metadata is proper and that the clock values across the replica set is consistent
  try {
    await checkUserMetadataAndClockValues({
      walletIndexes,
      walletIdMap,
      userMetadatas,
      picturePath: SECOND_USER_PIC_PATH,
      executeOne,
      executeAll
    })
  } catch (e) {
    return {
      error: `User pre-track upload -- ${e.message}`
    }
  }

  await upgradeUsersToCreators(executeAll, executeOne)

  if (enableFaultInjection) {
    // Create a MadDog instance, responsible for taking down nodes
    const m = new MadDog({ numCreatorNodes })
    m.start()
  }

  // Run emitter test, wait for it to finish
  await emitterTest.run()
  logger.info('Emitter test exited')

  /**
   * Verify results
   */

  // Check all user replicas until they are synced up to primary
  await executeAll(async (libs, i) => {
    await ensureReplicaSetSyncIsConsistent({ i, executeOne, libs })
  })

  // create array of track upload info to verify
  const trackUploadInfo = []
  for (const walletIndex of Object.keys(walletTrackMap)) {
    const userId = walletIdMap[walletIndex]
    const tracks = walletTrackMap[walletIndex]
    if (!tracks) continue
    for (const trackId of tracks) {
      trackUploadInfo.push({
        walletIndex,
        trackId,
        userId
      })
    }
  }

  // Ensure all CIDs exist on all replicas
  const allCIDsExistOnCNodes = await verifyAllCIDsExistOnCNodes(trackUploadInfo, executeOne)
  if (!allCIDsExistOnCNodes) {
    return { error: 'Not all CIDs exist on creator nodes.' }
  }

  const failedWallets = Object.values(failedUploads)
  if (failedWallets.length) {
    const userIds = failedWallets.map(w => walletIdMap[w])
    return {
      error: `Uploads failed for user IDs=[${userIds}].`
    }
  }

  // Switch user primary (above tests have already confirmed all secondaries have latest state)
  for await (const walletIndex of Object.keys(walletIdMap)) {
    const userId = walletIdMap[walletIndex]
    const userMetadata = await executeOne(walletIndex, l => getUser(l, userId))
    const wallet = userMetadata.wallet
    const [primary, ...secondaries] = userMetadata.creator_node_endpoint.split(',')

    logger.info(`userId=${userId} wallet=${wallet} rset=${userMetadata.creator_node_endpoint}`)

    // Define new rset by swapping primary and first secondary
    const newRSet = (secondaries.length) ? [secondaries[0], primary].concat(secondaries.slice(1)) : [primary]

    // Update libs instance with new endpoint
    await executeOne(walletIndex, libs => setCreatorNodeEndpoint(libs, newRSet[0]))

    // Update user metadata obj
    const newMetadata = { ...userMetadata }
    newMetadata.creator_node_endpoint = newRSet.join(',')

    // Update creator state on CN and chain
    await executeOne(walletIndex, libs => updateCreator(libs, userId, newMetadata))

    logger.info(`Successfully updated creator with userId=${userId} on CN and Chain`)
  }

  // Check all user replicas until they are synced up to primary
  await executeAll(async (libs, i) => {
    await ensureReplicaSetSyncIsConsistent({ i, executeOne, libs })
  })

  // TODO call export on each node and verify equality

  // TODO Upload more content to new primary + verify

  // Remove temp storage dirs
  await fs.remove(TEMP_STORAGE_PATH)
  await fs.remove(TEMP_IMG_STORAGE_PATH)

  userMetadatas = await executeOne(walletIndexes[0], libsWrapper => {
    return getUsers(libsWrapper, userIds)
  })

  // Check that certain MD fields in disc node are what we expected it to be after uploading first track
  userMetadatas.forEach(user => {
    logger.info(`Checking post track upload metadata for user=${user.user_id}...`)
    if (user.is_creator) {
      return {
        error: `User ${user.user_id} should be a creator after track upload.`
      }
    }

    if (!user.creator_node_endpoint) {
      return {
        error: `User ${user.user_id} should have kept their replica set.`
      }
    }

    if (!user.profile_picture_sizes) {
      return {
        error: `User ${user.user_id} should have an updated profile picture.`
      }
    }
  })

  // Check user metadata is proper and that the clock values across the replica set is consistent
  try {
    await checkUserMetadataAndClockValues({
      walletIndexes,
      walletIdMap,
      userMetadatas,
      picturePath: THIRD_USER_PIC_PATH,
      executeOne,
      executeAll
    })
  } catch (e) {
    console.log(e)
    return {
      error: `User post track upload -- ${e.message}`
    }
  }

  verifyThresholds()
  printTestSummary()

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
    userIdRSetMap[userId] = user.creator_node_endpoint.split(',')
  }

  // Now, confirm each of these CIDs are on each user replica
  const failedCIDs = []
  for (const userId of userIds) {
    const userRSet = userIdRSetMap[userId]
    const cids = userCIDMap[userId]

    if (!cids) continue

    await Promise.all(cids.map(async (cid) => {
      await Promise.all(userRSet.map(async (replica) => {
        // TODO: add `fromFS` option when this is merged back into CN.
        const exists = await verifyCIDExistsOnCreatorNode(cid, replica)

        logger.info(`Verified CID ${cid} for user=${userId} on replica [${replica}]!`)
        if (!exists) {
          logger.warn(`Could not find CID ${cid} for user=${userId} on replica ${replica}`)
          failedCIDs.push(cid)
        }
      }))
    }))
  }
  logger.info('Completed verifying CIDs')
  return !failedCIDs.length
}

/**
 * NOTE - function name is inaccurate
 *
 * Confirms replica set is synced, metadata is available from every replica.
 * Then uploads a photo and updates metadata, and performs validation once again.
 */
async function checkUserMetadataAndClockValues ({
  walletIndexes,
  walletIdMap,
  userMetadatas,
  picturePath,
  executeOne,
  executeAll
}) {
  try {
    await executeAll(async (libs, i) => {
      // Check that the clock values across replica set are equal
      await ensureReplicaSetSyncIsConsistent({ i, executeOne, libs })

      // Check that the metadata object in CN across replica set is what we expect it to be
      const replicaSetEndpoints = await executeOne(i, libs =>
        getContentNodeEndpoints(libs, userMetadatas[i].creator_node_endpoint)
      )

      await checkMetadataEquality({
        endpoints: replicaSetEndpoints,
        metadataMultihash: userMetadatas[i].metadata_multihash,
        userId: libs.userId
      })

      // Update MD (bio + photo) and check that 2 and 3 are correct
      const updatedBio = 'i am so cool ' + r6()
      await executeOne(i, async libs => {
        const newMetadata = { ...userMetadatas[i] }
        newMetadata.bio = updatedBio

        // Update profile picture and metadata accordingly
        logger.info(`Updating metadata for user=${libs.userId}...`)
        await uploadPhotoAndUpdateMetadata(libs, {
          metadata: newMetadata,
          userId: libs.userId,
          picturePath,
          updateCoverPhoto: false
        })
      })

      await ensureReplicaSetSyncIsConsistent({ i, libs, executeOne })

      // Check that the updated MD is correct with the updated bio and profile picture
      const updatedUser = await executeOne(i, libs => getUser(libs, libs.userId))
      await checkMetadataEquality({
        endpoints: replicaSetEndpoints,
        metadataMultihash: updatedUser.metadata_multihash,
        userId: libs.userId
      })
    })
  } catch (e) {
    console.log(e)
    throw e
  }
}

async function checkMetadataEquality ({ endpoints, metadataMultihash, userId }) {
  logger.info(`Checking metadata across replica set is consistent user=${userId}...`)
  const start = Date.now()

  const replicaSetMetadatas = (await Promise.all(
    endpoints.map(endpoint => {
      const promise = retry(
        async () => {
          return axios({
            url: `/ipfs/${metadataMultihash}`,
            method: 'get',
            baseURL: endpoint,
            timeout: 4000
          })
        },
        {
          retries: 5,
          maxTimeout: 5000 // ms
        }
      )
      return promise
    })
  )).map(response => response.data)
  logger.info(`Completed metadata check for user ${userId} in ${Date.now() - start}ms`)

  const fieldsToCheck = [
    'is_creator',
    'creator_node_endpoint',
    'profile_picture_sizes',
    'bio'
  ]

  // Primary = index 0, secondaries = indexes 1,2
  fieldsToCheck.forEach(field => {
    const primaryValue = replicaSetMetadatas[0][field]
    if (
      replicaSetMetadatas[1][field] !== primaryValue ||
      replicaSetMetadatas[2][field] !== primaryValue
    ) {
      throw new Error(
        `Field ${field} in secondaries does not match what is in primary.\nPrimary: ${primaryValue}\nSecondaries: ${replicaSetMetadatas[1][field]},${replicaSetMetadatas[2][field]}`
      )
    }
  })
}

const verifyThresholds = () => {
  const numberOfTicks = (TEST_DURATION_SECONDS / TICK_INTERVAL_SECONDS) - 1
  assert.ok(uploadedTracks.length > (numberOfTicks / 5))
  assert.ok(repostedTracks.length > (numberOfTicks / 10))
  assert.ok(createdPlaylists.length > (numberOfTicks / 10))
  assert.ok(addedPlaylistTracks.length > (numberOfTicks / 10))
}

const printTestSummary = () => {
  logger.info('\n------------------------ AUDIUS CORE INTEGRATION TEST Summary ------------------------')
  logger.info(`uploadedTracks: ${uploadedTracks.length}                | Total uploaded tracks`)
  logger.info(`repostedTracks: ${repostedTracks.length}                | Total reposted tracks`)
  logger.info(`createdPlaylists: ${Object.values(createdPlaylists).flat().length}                | Total created playlists`)
  logger.info(`addedPlaylistTracks: ${addedPlaylistTracks.length}                | Total added playlist tracks`)
}
