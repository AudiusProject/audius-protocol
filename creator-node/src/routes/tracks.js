const express = require('express')
const path = require('path')
const fs = require('fs-extra')

const config = require('../config')
const models = require('../models')
const {
  saveFileFromBufferToDisk,
  removeTrackFolder,
  getTmpTrackUploadArtifactsPathWithInputUUID,
  handleTrackContentUpload
} = require('../fileManager')
const {
  handleResponse,
  sendResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseServerError,
  errorResponseForbidden
} = require('../apiHelpers')
const {
  validateStateForImageDirCIDAndReturnFileUUID,
  currentNodeShouldHandleTranscode
} = require('../utils')
const { asyncRetry } = require('../utils/asyncRetry')
const {
  authMiddleware,
  ensurePrimaryMiddleware,
  issueAndWaitForSecondarySyncRequests,
  ensureStorageMiddleware,
  ensureValidSPMiddleware
} = require('../middlewares')
const { decode } = require('../hashids')
const { getCID, streamFromFileSystem } = require('./files')
const DBManager = require('../dbManager')
const { generateListenTimestampAndSignature } = require('../apiSigning')
const BlacklistManager = require('../blacklistManager')
const TranscodingQueue = require('../TranscodingQueue')
const { tracing } = require('../tracer')
const {
  contentAccessMiddleware
} = require('../middlewares/contentAccess/contentAccessMiddleware')

const router = express.Router()

/**
 * Add a track transcode task into the worker queue. If the track file is uploaded properly (not transcoded), return successResponse
 * @note this track content route is used in conjunction with the polling.
 */
router.post(
  '/track_content_async',
  authMiddleware,
  ensurePrimaryMiddleware,
  ensureStorageMiddleware,
  handleTrackContentUpload,
  handleResponse(async (req, _res) => {
    tracing.setSpanAttribute('requestID', req.logContext.requestID)
    if (req.fileSizeError || req.fileFilterError) {
      removeTrackFolder({ logContext: req.logContext }, req.fileDir)
      return errorResponseBadRequest(req.fileSizeError || req.fileFilterError)
    }

    const AsyncProcessingQueue =
      req.app.get('serviceRegistry').asyncProcessingQueue

    const selfTranscode = currentNodeShouldHandleTranscode({
      transcodingQueueCanAcceptMoreJobs: await TranscodingQueue.isAvailable(),
      spID: config.get('spID')
    })

    if (selfTranscode) {
      tracing.info('adding upload track task')
      await AsyncProcessingQueue.addTrackContentUploadTask({
        parentSpanContext: tracing.currentSpanContext(),
        logContext: req.logContext,
        req: {
          fileName: req.fileName,
          fileDir: req.fileDir,
          fileDestination: req.file.destination,
          cnodeUserUUID: req.session.cnodeUserUUID
        }
      })
    } else {
      tracing.info('adding transcode handoff task')
      await AsyncProcessingQueue.addTranscodeHandOffTask({
        parentSpanContext: tracing.currentSpanContext(),
        logContext: req.logContext,
        req: {
          fileName: req.fileName,
          fileDir: req.fileDir,
          fileNameNoExtension: req.fileNameNoExtension,
          fileDestination: req.file.destination,
          cnodeUserUUID: req.session.cnodeUserUUID,
          headers: req.headers
        }
      })
    }

    return successResponse({ uuid: req.logContext.requestID })
  })
)

/**
 * Delete all temporary transcode artifacts from track transcode handoff flow.
 * This is called on the node that was handed off the transcode to clear the state from disk
 */
router.post(
  '/clear_transcode_and_segment_artifacts',
  ensureValidSPMiddleware,
  handleResponse(async (req, _res) => {
    const fileDir = req.body.fileDir
    req.logger.debug('Clearing filesystem fileDir', fileDir)
    if (!fileDir.includes('tmp_track_artifacts')) {
      return errorResponseBadRequest(
        'Cannot remove track folder outside temporary track artifacts'
      )
    }
    await removeTrackFolder({ logContext: req.logContext }, fileDir)

    return successResponse()
  })
)

/**
 * Given that the requester is a valid SP, the current Content Node has enough storage,
 * upload the track to the current node and add a transcode and segmenting job to the queue.
 *
 * This route is used on an available SP when the primary sends over a transcode and segment request
 * to initiate the transcode handoff. This route does not run on the primary.
 */
router.post(
  '/transcode_and_segment',
  ensureValidSPMiddleware,
  ensureStorageMiddleware,
  handleTrackContentUpload,
  handleResponse(async (req, _res) => {
    const AsyncProcessingQueue =
      req.app.get('serviceRegistry').asyncProcessingQueue

    await AsyncProcessingQueue.addTranscodeAndSegmentTask({
      logContext: req.logContext,
      req: {
        fileName: req.fileName,
        fileDir: req.fileDir,
        uuid: req.logContext.requestID
      }
    })

    return successResponse({ uuid: req.logContext.requestID })
  })
)

/**
 * Given that the request is coming from a valid SP, serve the corresponding file
 * from the transcode handoff
 *
 * This route is called from the primary to request the transcoded files after
 * sending the first request for the transcode handoff. This route does not run on the primary.
 */
router.get(
  '/transcode_and_segment',
  ensureValidSPMiddleware,
  async (req, res) => {
    const fileName = req.query.fileName
    const fileType = req.query.fileType
    const uuid = req.query.uuid

    if (!fileName || !fileType || !uuid) {
      return sendResponse(
        req,
        res,
        errorResponseBadRequest(
          `No provided filename=${fileName}, fileType=${fileType}, or uuid=${uuid}`
        )
      )
    }

    const basePath = await getTmpTrackUploadArtifactsPathWithInputUUID(uuid)
    let pathToFile
    if (fileType === 'transcode') {
      pathToFile = path.join(basePath, fileName)
    } else if (fileType === 'segment') {
      pathToFile = path.join(basePath, 'segments', fileName)
    } else if (fileType === 'm3u8') {
      pathToFile = path.join(basePath, fileName)
    }

    try {
      return await streamFromFileSystem(req, res, pathToFile)
    } catch (e) {
      return sendResponse(
        req,
        res,
        errorResponseServerError(
          `Could not serve content, error=${e.toString()}`
        )
      )
    }
  }
)

/**
 * Given track metadata object, save metadata to disk. Return metadata multihash if successful.
 * If metadata is for a downloadable track, ensures transcoded master record exists in DB
 */
router.post(
  '/tracks/metadata',
  authMiddleware,
  ensurePrimaryMiddleware,
  ensureStorageMiddleware,
  handleResponse(async (req, _res) => {
    const metadataJSON = req.body.metadata

    if (
      !metadataJSON ||
      !metadataJSON.owner_id ||
      // todo: add the below check once all tracks have track cid
      // !metadataJSON.track_cid ||
      !metadataJSON.track_segments ||
      !Array.isArray(metadataJSON.track_segments) ||
      !metadataJSON.track_segments.length
    ) {
      return errorResponseBadRequest(
        // todo: update below message once all tracks have track cid
        // 'Metadata object must include owner_id and track_cid and non-empty track_segments array'
        'Metadata object must include owner_id and non-empty track_segments array'
      )
    }

    // If metadata indicates track is downloadable but doesn't provide a transcode CID,
    //    ensure that a transcoded master record exists in DB
    if (
      metadataJSON.download &&
      metadataJSON.download.is_downloadable &&
      !metadataJSON.download.cid
    ) {
      const sourceFile = req.body.sourceFile
      const trackId = metadataJSON.track_id
      if (!sourceFile && !trackId) {
        return errorResponseBadRequest(
          'Cannot make downloadable - A sourceFile must be provided or the metadata object must include track_id'
        )
      }

      // See if the track already has a transcoded master
      if (trackId) {
        const { blockchainId } = await models.Track.findOne({
          attributes: ['blockchainId'],
          where: {
            blockchainId: trackId
          },
          order: [['clock', 'DESC']]
        })

        // Error if no DB entry for transcode found
        const transcodedFile = await models.File.findOne({
          attributes: ['multihash'],
          where: {
            cnodeUserUUID: req.session.cnodeUserUUID,
            type: 'copy320',
            trackBlockchainId: blockchainId
          }
        })
        if (!transcodedFile) {
          return errorResponseServerError('Failed to find transcoded file')
        }
      }
    }

    const metadataBuffer = Buffer.from(JSON.stringify(metadataJSON))
    const cnodeUserUUID = req.session.cnodeUserUUID

    // Save file from buffer to disk
    let multihash, dstPath
    try {
      const resp = await saveFileFromBufferToDisk(req, metadataBuffer)
      multihash = resp.cid
      dstPath = resp.dstPath
    } catch (e) {
      return errorResponseServerError(
        `/tracks/metadata saveFileFromBufferToDisk op failed: ${e}`
      )
    }

    // Record metadata file entry in DB
    const transaction = await models.sequelize.transaction()
    let fileUUID
    try {
      const createFileQueryObj = {
        multihash,
        sourceFile: req.fileName,
        storagePath: dstPath,
        type: 'metadata' // TODO - replace with models enum
      }
      const file = await DBManager.createNewDataRecord(
        createFileQueryObj,
        cnodeUserUUID,
        models.File,
        transaction
      )
      fileUUID = file.fileUUID

      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      return errorResponseServerError(`Could not save to db db: ${e}`)
    }

    // Await 2/3 write quorum (replicating data to at least 1 secondary)
    await issueAndWaitForSecondarySyncRequests(req)

    return successResponse({
      metadataMultihash: multihash,
      metadataFileUUID: fileUUID
    })
  })
)

const validateTrackOwner = async ({
  libs,
  logger,
  trackId,
  userId,
  blockNumber
}) => {
  const logPrefix = `[validateTrackOwner][trackId: ${trackId}][userId: ${userId}][blockNumber: ${blockNumber}]`

  const asyncFn = async () => {
    const discoveryTrackResponseVerbose = await libs.Track.getTracksVerbose(
      1,
      0,
      [trackId]
    )
    const discoveryProviderEndpoint =
      libs.discoveryProvider.discoveryProviderEndpoint
    const {
      latest_indexed_block: latestIndexedBlock,
      latest_chain_block: latestChainBlock,
      data: discoveryTrackResponse
    } = discoveryTrackResponseVerbose

    // Return if malformatted response
    if (
      !latestIndexedBlock ||
      !latestChainBlock ||
      !Array.isArray(discoveryTrackResponse)
    ) {
      logger.warn(
        `${logPrefix}: Malformed track response from discovery ${discoveryProviderEndpoint} - Received ${JSON.stringify(
          discoveryTrackResponseVerbose
        )}`
      )
      return false
    }

    // Throw if target blockNumber not indexed
    const blockDiff = latestChainBlock - latestIndexedBlock
    if (latestIndexedBlock < blockNumber) {
      throw new Error(
        `${logPrefix}: targetBlocknumber not indexed. ${discoveryProviderEndpoint} currently at ${latestIndexedBlock} with blockDiff ${blockDiff}`
      )
    }

    // Return if track not found at target block
    if (discoveryTrackResponse.length === 0) {
      logger.warn(
        `${logPrefix} No track found from ${discoveryProviderEndpoint}`
      )
      return false
    }

    // Return boolean indicating if track owner matches expected
    const recoveredOwnerId = discoveryTrackResponse[0].owner_id
    const ownerMatches = parseInt(userId) === recoveredOwnerId
    if (!ownerMatches) {
      logger.warn(
        `${logPrefix} Recovered owner ID does not match (${recoveredOwnerId}), from ${discoveryProviderEndpoint}`
      )
    }
    return ownerMatches
  }

  const startMs = Date.now()
  try {
    return await asyncRetry({
      asyncFn,
      logger,
      log: true,
      options: {
        minTimeout: 1000,
        factor: 2,
        retries: 10
      }
    })
  } finally {
    logger.info(`${logPrefix} Completed in ${Date.now() - startMs}ms`)
  }
}

/**
 * Given track blockchainTrackId, blockNumber, and metadataFileUUID, creates/updates Track DB track entry
 * and associates segment & image file entries with track. Ends track creation/update process.
 */
router.post(
  '/tracks',
  authMiddleware,
  ensurePrimaryMiddleware,
  ensureStorageMiddleware,
  handleResponse(async (req, _res) => {
    const {
      blockchainTrackId,
      blockNumber,
      metadataFileUUID,
      transcodedTrackUUID
    } = req.body

    // Input validation
    if (!blockchainTrackId || !blockNumber || !metadataFileUUID) {
      return errorResponseBadRequest(
        'Must include blockchainTrackId, blockNumber, and metadataFileUUID.'
      )
    }

    // Error on outdated blocknumber
    const cnodeUser = req.session.cnodeUser
    if (blockNumber < cnodeUser.latestBlockNumber) {
      return errorResponseBadRequest(
        `Invalid blockNumber param ${blockNumber}. Must be greater or equal to previously processed blocknumber ${cnodeUser.latestBlockNumber}.`
      )
    }
    const cnodeUserUUID = req.session.cnodeUserUUID

    // Fetch metadataJSON for metadataFileUUID, error if not found or malformatted
    const file = await models.File.findOne({
      where: { fileUUID: metadataFileUUID, cnodeUserUUID }
    })
    if (!file) {
      return errorResponseBadRequest(
        `No file db record found for provided metadataFileUUID ${metadataFileUUID}.`
      )
    }
    let metadataJSON
    try {
      const fileBuffer = await fs.readFile(file.storagePath)
      metadataJSON = JSON.parse(fileBuffer)
      if (
        !metadataJSON ||
        !metadataJSON.track_segments ||
        !Array.isArray(metadataJSON.track_segments) ||
        !metadataJSON.track_segments.length
      ) {
        return errorResponseServerError(
          `Malformatted metadataJSON stored for metadataFileUUID ${metadataFileUUID}.`
        )
      }
    } catch (e) {
      return errorResponseServerError(
        `No file stored on disk for metadataFileUUID ${metadataFileUUID} at storagePath ${file.storagePath}.`
      )
    }

    // Get coverArtFileUUID for multihash in metadata object, else error
    let coverArtFileUUID
    try {
      coverArtFileUUID = await validateStateForImageDirCIDAndReturnFileUUID(
        req,
        metadataJSON.cover_art_sizes
      )
    } catch (e) {
      return errorResponseServerError(e.message)
    }

    const transaction = await models.sequelize.transaction()
    try {
      const existingTrackEntry = await models.Track.findOne({
        where: {
          cnodeUserUUID,
          blockchainId: blockchainTrackId
        },
        order: [['clock', 'DESC']],
        transaction
      })

      // Insert track entry in DB
      const createTrackQueryObj = {
        metadataFileUUID,
        metadataJSON,
        blockchainId: blockchainTrackId,
        coverArtFileUUID
      }
      const track = await DBManager.createNewDataRecord(
        createTrackQueryObj,
        cnodeUserUUID,
        models.Track,
        transaction
      )

      /**
       * Associate matching transcode & segment files on DB with new/updated track
       * Must be done in same transaction to atomicity
       *
       * TODO - consider implications of edge-case -> two attempted /track_content before associate
       */

      const trackSegmentCIDs = metadataJSON.track_segments.map(
        (segment) => segment.multihash
      )

      // if track created, ensure files exist with trackBlockchainId = null and update them
      if (!existingTrackEntry) {
        if (!transcodedTrackUUID) {
          throw new Error('Cannot create track without transcodedTrackUUID.')
        }

        // Verify that track id is owned by user attempting to upload it
        const libs = req.app.get('audiusLibs')
        const isValidTrackOwner = await validateTrackOwner({
          libs,
          trackId: blockchainTrackId,
          userId: req.session.userId,
          logger: req.logger,
          blockNumber
        })
        if (!isValidTrackOwner) {
          throw new Error(
            `Failed to confirm that user ${req.session.userId} is owner of ${blockchainTrackId} at blocknumber ${blockNumber}`
          )
        }

        // Associate the transcode file db record with trackUUID
        const transcodedFile = await models.File.findOne({
          where: {
            fileUUID: transcodedTrackUUID,
            cnodeUserUUID,
            trackBlockchainId: null,
            type: 'copy320'
          },
          transaction
        })
        if (!transcodedFile || !transcodedFile.sourceFile) {
          throw new Error(
            'Did not find a transcoded file for the provided CID.'
          )
        }
        const transcodeAssociateNumAffectedRows = await models.File.update(
          { trackBlockchainId: track.blockchainId },
          {
            where: {
              fileUUID: transcodedTrackUUID,
              cnodeUserUUID,
              trackBlockchainId: null,
              type: 'copy320' // TODO - replace with model enum
            },
            transaction
          }
        )
        if (transcodeAssociateNumAffectedRows === 0) {
          throw new Error(
            'Failed to associate the transcoded file for the provided track UUID.'
          )
        }

        // Associate all segment file db records with trackUUID
        const trackFiles = await models.File.findAll({
          where: {
            multihash: trackSegmentCIDs,
            cnodeUserUUID,
            trackBlockchainId: null,
            type: 'track',
            sourceFile: transcodedFile.sourceFile
          },
          transaction
        })

        if (trackFiles.length !== trackSegmentCIDs.length) {
          req.logger.error(
            `Did not find files for every track segment CID for user ${cnodeUserUUID} ${trackFiles} ${trackSegmentCIDs}`
          )
          throw new Error('Did not find files for every track segment CID.')
        }
        const segmentsAssociateNumAffectedRows = await models.File.update(
          { trackBlockchainId: track.blockchainId },
          {
            where: {
              multihash: trackSegmentCIDs,
              cnodeUserUUID,
              trackBlockchainId: null,
              type: 'track',
              sourceFile: transcodedFile.sourceFile
            },
            transaction
          }
        )
        if (
          parseInt(segmentsAssociateNumAffectedRows, 10) !==
          trackSegmentCIDs.length
        ) {
          req.logger.error(
            `Failed to associate files for every track segment CID ${cnodeUserUUID} ${track.blockchainId} ${segmentsAssociateNumAffectedRows} ${trackSegmentCIDs.length}`
          )
          throw new Error(
            'Failed to associate files for every track segment CID.'
          )
        }
      } /** updateTrack scenario */ else {
        /**
         * If track updated, ensure files exist with trackBlockchainId
         */

        // Ensure transcode file db record exists, if uuid provided
        if (transcodedTrackUUID) {
          const transcodedFile = await models.File.findOne({
            where: {
              fileUUID: transcodedTrackUUID,
              cnodeUserUUID,
              trackBlockchainId: track.blockchainId,
              type: 'copy320'
            },
            transaction
          })
          if (!transcodedFile) {
            throw new Error(
              'Did not find the corresponding transcoded file for the provided track UUID.'
            )
          }
        }

        // Ensure segment file db records exist for all CIDs
        const trackFiles = await models.File.findAll({
          where: {
            multihash: trackSegmentCIDs,
            cnodeUserUUID,
            trackBlockchainId: track.blockchainId,
            type: 'track'
          },
          transaction
        })
        if (trackFiles.length < trackSegmentCIDs.length) {
          throw new Error(
            'Did not find files for every track segment CID with trackBlockchainId.'
          )
        }
      }

      // Update cnodeUser's latestBlockNumber if higher than previous latestBlockNumber.
      // TODO - move to subquery to guarantee atomicity.
      const updatedCNodeUser = await models.CNodeUser.findOne({
        where: { cnodeUserUUID },
        transaction
      })
      if (!updatedCNodeUser || !updatedCNodeUser.latestBlockNumber) {
        throw new Error('Issue in retrieving udpatedCnodeUser')
      }
      req.logger.debug(
        `cnodeuser ${cnodeUserUUID} first latestBlockNumber ${cnodeUser.latestBlockNumber} || \
        current latestBlockNumber ${updatedCNodeUser.latestBlockNumber} || \
        given blockNumber ${blockNumber}`
      )
      if (blockNumber > updatedCNodeUser.latestBlockNumber) {
        // Update cnodeUser's latestBlockNumber
        await cnodeUser.update(
          { latestBlockNumber: blockNumber },
          { transaction }
        )
      }

      await transaction.commit()

      // Discovery only indexes metadata and not files, so we eagerly replicate data but don't await it
      issueAndWaitForSecondarySyncRequests(req, true)

      return successResponse()
    } catch (e) {
      req.logger.error(e.message)
      await transaction.rollback()
      return errorResponseServerError(e.message)
    }
  })
)

/** Returns download status of track and 320kbps CID if ready + downloadable. */
router.get(
  '/tracks/download_status/:blockchainId',
  handleResponse(async (req, _res) => {
    const blockchainId = req.params.blockchainId
    if (!blockchainId) {
      return errorResponseBadRequest('Please provide blockchainId.')
    }

    const track = await models.Track.findOne({
      where: { blockchainId },
      order: [['clock', 'DESC']]
    })
    if (!track) {
      return errorResponseBadRequest(
        `No track found for blockchainId ${blockchainId}`
      )
    }

    // Case: track is not marked as downloadable
    if (
      !track.metadataJSON ||
      !track.metadataJSON.download ||
      !track.metadataJSON.download.is_downloadable
    ) {
      return successResponse({ isDownloadable: false, cid: null })
    }

    // Case: track is marked as downloadable
    // - Check if downloadable file exists. Since copyFile may or may not have trackBlockchainId association,
    //    fetch a segmentFile for trackBlockchainId, and find copyFile for segmentFile's sourceFile.
    const segmentFile = await models.File.findOne({
      where: {
        type: 'track',
        trackBlockchainId: track.blockchainId
      }
    })
    const copyFile = await models.File.findOne({
      where: {
        type: 'copy320',
        sourceFile: segmentFile.sourceFile
      }
    })

    // Serve from file system
    return successResponse({
      isDownloadable: true,
      cid: copyFile ? copyFile.multihash : null
    })
  })
)

/**
 * Gets a streamable mp3 link for a track by encodedId. Supports range request headers.
 * @dev - Wrapper around getCID, which retrieves track given its CID.
 **/
router.get(
  '/tracks/stream/:encodedId',
  async (req, res, next) => {
    const libs = req.app.get('audiusLibs')
    const redisClient = req.app.get('redisClient')
    const delegateOwnerWallet = config.get('delegateOwnerWallet')

    const encodedId = req.params.encodedId
    if (!encodedId) {
      return sendResponse(
        req,
        res,
        errorResponseBadRequest('Please provide a track ID')
      )
    }

    const blockchainId = decode(encodedId)
    if (!blockchainId) {
      return sendResponse(
        req,
        res,
        errorResponseBadRequest(`Invalid ID: ${encodedId}`)
      )
    }

    const isNotServable = await BlacklistManager.trackIdIsInBlacklist(
      blockchainId
    )
    if (isNotServable) {
      return sendResponse(
        req,
        res,
        errorResponseForbidden(
          `trackId=${blockchainId} cannot be served by this node`
        )
      )
    }

    // attempt to fetch cached stream data for blockchainId
    // if found, bypass the db and discovery queries and proceed to getCID
    try {
      const cachedData = await redisClient.get(
        `trackStreamCache:::${blockchainId}`
      )

      if (cachedData) {
        if (libs.identityService) {
          req.logger.info(
            `Logging listen for track ${blockchainId} by ${delegateOwnerWallet}`
          )
          const signatureData = generateListenTimestampAndSignature(
            config.get('delegatePrivateKey')
          )
          // Fire and forget listen recording
          libs.identityService.logTrackListen(
            blockchainId,
            delegateOwnerWallet,
            req.ip,
            signatureData
          )
        }

        req.params.CID = cachedData
        req.params.streamable = true
        res.set('Content-Type', 'audio/mpeg')
        res.set('Copy320-CID', cachedData)
        // early exit and call next() which continues to getCID
        return next()
      }
    } catch (e) {
      // do nothing if unable to fetch cached data from redis, continue with rest of the process
      req.logger.debug(
        `Could not fetch cached track stream data for track ${blockchainId}`
      )
    }

    const debugTimings = {}

    const findCopy320Start = Date.now()
    let fileRecord = await models.File.findOne({
      attributes: ['multihash'],
      where: {
        type: 'copy320',
        trackBlockchainId: blockchainId
      },
      order: [['clock', 'DESC']]
    })
    debugTimings.findCopy320 = (Date.now() - findCopy320Start) / 1000

    // if track didn't finish the upload process and was never associated, there may not be a trackBlockchainId for the File records,
    // try to fall back to discovery to fetch the metadata multihash and see if you can deduce the copy320 file
    if (!fileRecord) {
      try {
        const findTrackRecordInDiscoveryStart = Date.now()
        let trackRecord = await libs.Track.getTracks(1, 0, [blockchainId])
        if (
          !trackRecord ||
          trackRecord.length === 0 ||
          !trackRecord[0].hasOwnProperty('blocknumber')
        ) {
          return sendResponse(
            req,
            res,
            errorResponseServerError(
              'Missing or malformatted track fetched from discovery node.'
            )
          )
        }
        debugTimings.findTrackRecordInDiscovery =
          (Date.now() - findTrackRecordInDiscoveryStart) / 1000

        trackRecord = trackRecord[0]

        // query the files table for a metadata multihash from discovery for a given track
        // no need to add CNodeUserUUID to the filter because the track is associated with a user and that contains the
        // user_id inside it which is unique to the user
        const findMetadataMultihashForTrackStart = Date.now()
        const file = await models.File.findOne({
          where: {
            multihash: trackRecord.metadata_multihash,
            type: 'metadata'
          }
        })
        if (!file) {
          return sendResponse(
            req,
            res,
            errorResponseServerError(
              'Missing or malformatted track fetched from discovery node.'
            )
          )
        }
        debugTimings.findMetadataMultihashForTrack =
          (Date.now() - findMetadataMultihashForTrackStart) / 1000

        // make sure all track segments have the same sourceFile
        const segments = trackRecord.track_segments.map(
          (segment) => segment.multihash
        )

        const findSourceFileForSegmentsStart = Date.now()
        // return a sourceFile which contains segments
        const sourceFileRecord = await models.File.findOne({
          attributes: [
            models.sequelize.fn('DISTINCT', models.sequelize.col('sourceFile'))
          ],
          where: {
            multihash: segments,
            cnodeUserUUID: file.cnodeUserUUID
          },
          raw: true
        })
        debugTimings.findSourceFileForSegments =
          (Date.now() - findSourceFileForSegmentsStart) / 1000

        // search for the copy320 record based on the sourceFile
        const findCopy320AfterFallbackStart = Date.now()
        fileRecord = await models.File.findOne({
          attributes: ['multihash'],
          where: {
            type: 'copy320',
            sourceFile: sourceFileRecord.sourceFile
          },
          raw: true
        })
        debugTimings.findCopy320AfterFallback =
          (Date.now() - findCopy320AfterFallbackStart) / 1000
      } catch (e) {
        req.logger.error(
          { error: e },
          `Error falling back to reconstructing data from discovery to stream`
        )
      }
    }

    req.logger.info(
      `Track stream debug timings - ${JSON.stringify(debugTimings)}`
    )

    if (!fileRecord || !fileRecord.multihash) {
      return sendResponse(
        req,
        res,
        errorResponseBadRequest(
          `No file found for blockchainId ${blockchainId}`
        )
      )
    }

    if (libs.identityService) {
      req.logger.info(
        `Logging listen for track ${blockchainId} by ${delegateOwnerWallet}`
      )
      const signatureData = generateListenTimestampAndSignature(
        config.get('delegatePrivateKey')
      )
      // Fire and forget listen recording
      // TODO: Consider queueing these requests
      libs.identityService.logTrackListen(
        blockchainId,
        delegateOwnerWallet,
        req.ip,
        signatureData
      )
    }

    req.params.CID = fileRecord.multihash
    req.params.streamable = true
    res.set('Content-Type', 'audio/mpeg')
    res.set('Copy320-CID', fileRecord.multihash)
    await redisClient.set(
      `trackStreamCache:::${blockchainId}`,
      fileRecord.multihash,
      'EX',
      60 * 60 /* one hour */
    )
    next()
  },
  getCID
)

/**
 * Gets a streamable mp3 link for a track by encodedId. Supports range request headers.
 * @dev - Wrapper around getCID, which retrieves track given its CID.
 **/
router.get(
  '/tracks/cidstream/:CID',
  contentAccessMiddleware,
  async (req, res, next) => {
    const libs = req.app.get('audiusLibs')
    const redisClient = req.app.get('redisClient')
    const delegateOwnerWallet = config.get('delegateOwnerWallet')

    const trackId = req.trackId
    const CID = req.params.CID

    if (!trackId) {
      return sendResponse(
        req,
        res,
        errorResponseBadRequest('Please provide a track ID')
      )
    }

    // Both the trackBlockchainId and the track CID need to checked whether
    // they are in the blacklist. That's the only reason `trackId`
    // is in the request. Ideally we should only check track CID but
    // that would require another blackfill job on the Blacklist table
    const trackIdBlacklisted = await BlacklistManager.trackIdIsInBlacklist(
      trackId
    )
    const cidBlacklisted = await BlacklistManager.CIDIsInBlacklist(CID)
    const isNotServable = cidBlacklisted || trackIdBlacklisted
    if (isNotServable) {
      return sendResponse(
        req,
        res,
        errorResponseForbidden(
          `trackId=${trackId} cannot be served by this node`
        )
      )
    }

    if (libs.identityService) {
      req.logger.info(
        `Logging listen for track ${trackId} by ${delegateOwnerWallet}`
      )
      const signatureData = generateListenTimestampAndSignature(
        config.get('delegatePrivateKey')
      )
      // Fire and forget listen recording
      // TODO: Consider queueing these requests
      libs.identityService.logTrackListen(
        trackId,
        delegateOwnerWallet,
        req.ip,
        signatureData
      )
    }

    req.params.streamable = true
    res.set('Content-Type', 'audio/mpeg')
    res.set('Copy320-CID', CID)
    await redisClient.set(
      `trackStreamCache:::${trackId}`,
      CID,
      'EX',
      60 * 60 /* one hour */
    )
    next()
  },
  getCID
)

module.exports = router
