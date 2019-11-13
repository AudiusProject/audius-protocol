const path = require('path')
const fs = require('fs')
const { Buffer } = require('ipfs-http-client')

const ffmpeg = require('../ffmpeg')
const { getSegmentsDuration } = require('../segmentDuration')
const models = require('../models')
const { saveFileFromBuffer, saveFileToIPFSFromFS, removeTrackFolder, trackFileUpload } = require('../fileManager')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError, errorResponseForbidden } = require('../apiHelpers')
const { getFileUUIDForImageCID } = require('../utils')
const { authMiddleware, ensurePrimaryMiddleware, syncLockMiddleware, triggerSecondarySyncs } = require('../middlewares')

module.exports = function (app) {
  /**
   * upload track segment files and make avail - will later be associated with Audius track
   * @dev - currently stores each segment twice, once under random file UUID & once under IPFS multihash
   *      - this should be addressed eventually
   */
  app.post('/track_content', authMiddleware, ensurePrimaryMiddleware, syncLockMiddleware, trackFileUpload.single('file'), handleResponse(async (req, res) => {
    if (req.fileFilterError) return errorResponseBadRequest(req.fileFilterError)
    const routeTimeStart = Date.now()
    let codeBlockTimeStart = Date.now()

    // create and save track file segments to disk
    let segmentFilePaths
    try {
      req.logger.info(`Segmenting file ${req.fileName}...`)
      segmentFilePaths = await ffmpeg.segmentFile(req, req.fileDir, req.fileName)
      req.logger.info(`Time taken in /track_content to segment track file: ${Date.now() - codeBlockTimeStart}ms for file ${req.fileName}`)
    } catch (err) {
      removeTrackFolder(req, req.fileDir)
      return errorResponseServerError(err)
    }

    // for each path, call saveFile and get back multihash; return multihash + segment duration
    // run all async ops in parallel as they are not independent
    codeBlockTimeStart = Date.now()
    const t = await models.sequelize.transaction()

    let saveFilePromResps
    let segmentDurations
    try {
      req.logger.info(`segmentFilePaths.length ${segmentFilePaths.length}`)
      let counter = 1
      saveFilePromResps = await Promise.all(segmentFilePaths.map(async filePath => {
        const absolutePath = path.join(req.fileDir, 'segments', filePath)
        req.logger.info(`about to perform saveFileToIPFSFromFS #${counter++}`)
        let response = await saveFileToIPFSFromFS(req, absolutePath, 'track', req.fileName, t)
        response.segmentName = filePath
        return response
      }))
      req.logger.info(`Time taken in /track_content for saving segments to IPFS: ${Date.now() - codeBlockTimeStart}ms for file ${req.fileName}`)

      codeBlockTimeStart = Date.now()
      let fileSegmentPath = path.join(req.fileDir, 'segments')
      segmentDurations = await getSegmentsDuration(
        req,
        fileSegmentPath,
        req.fileName,
        req.file.destination
      )
      req.logger.info(`Time taken in /track_content to get segment duration: ${Date.now() - codeBlockTimeStart}ms for file ${req.fileName}`)

      // Commit transaction
      codeBlockTimeStart = Date.now()
      req.logger.info(`attempting to commit tx for file ${req.fileName}`)
      await t.commit()
    } catch (e) {
      req.logger.info(`failed to commit...rolling back. file ${req.fileName}`)
      await t.rollback()
      return errorResponseServerError(e)
    }
    req.logger.info(`Time taken in /track_content to commit tx block to db: ${Date.now() - codeBlockTimeStart}ms for file ${req.fileName}`)

    let trackSegments = saveFilePromResps.map((saveFileResp, i) => {
      let segmentName = saveFileResp.segmentName
      let duration = segmentDurations[segmentName]
      return { 'multihash': saveFileResp.multihash, 'duration': duration }
    })

    // exclude 0-length segments that are sometimes outputted by ffmpeg segmentation
    trackSegments = trackSegments.filter(trackSegment => trackSegment.duration)

    // Don't allow if any segment CID is in blacklist.
    try {
      await Promise.all(trackSegments.map(async segmentObj => {
        if (await req.app.get('blacklistManager').CIDIsInBlacklist(segmentObj.multihash)) {
          throw new Error(`Track upload failed - part or all of this track has been blacklisted by this node.`)
        }
      }))
    } catch (e) {
      if (e.message.indexOf('blacklisted') >= 0) {
        // TODO clean up orphaned content
        return errorResponseForbidden(`Track upload failed - part or all of this track has been blacklisted by this node.`)
      } else {
        return errorResponseServerError(e.message)
      }
    }

    req.logger.info(`Time taken in /track_content for full route: ${Date.now() - routeTimeStart}ms for file ${req.fileName}`)
    return successResponse({ 'track_segments': trackSegments, 'source_file': req.fileName })
  }))

  /**
   * Given track metadata object, upload and share metadata to IPFS. Return metadata multihash if successful.
   * Error if associated track segments have not already been created and stored.
   */
  app.post('/tracks/metadata', authMiddleware, ensurePrimaryMiddleware, syncLockMiddleware, handleResponse(async (req, res) => {
    const metadataJSON = req.body.metadata

    if (!metadataJSON || !metadataJSON.owner_id || !metadataJSON.track_segments || !Array.isArray(metadataJSON.track_segments)) {
      return errorResponseBadRequest('Metadata object must include owner_id and non-empty track_segments array')
    }

    // Error if any of provided segment multihashes are blacklisted.
    try {
      await Promise.all(metadataJSON.track_segments.map(async segment => {
        if (await req.app.get('blacklistManager').CIDIsInBlacklist(segment.multihash)) {
          throw new Error(`Segment CID ${segment.multihash} has been blacklisted by this node.`)
        }
      }))
    } catch (e) {
      return errorResponseForbidden(e.message)
    }

    // If track marked as downloadable, kick off transcoding process if necessary (don't block on this).
    if (metadataJSON.download && metadataJSON.download.is_downloadable && !metadataJSON.download.cid) {
      let sourceFile = req.body.sourceFile
      const trackId = metadataJSON.track_id
      if (!sourceFile && !trackId) {
        return errorResponseBadRequest('Cannot make downloadable - A sourceFile must be provided or the metadata object must include track_id')
      }

      // Find the sourceFile associated with the track if it wasn't provided, to be used in trancoding.
      if (!sourceFile) {
        const { trackUUID } = await models.Track.findOne({
          attributes: ['trackUUID'],
          where: {
            blockchainId: trackId
          }
        })
        const firstSegment = metadataJSON.track_segments[0]
        if (!firstSegment) return errorResponseServerError('No segment found for track')

        const file = await models.File.findOne({
          where: {
            multihash: firstSegment.multihash,
            cnodeUserUUID: req.session.cnodeUserUUID,
            trackUUID
          }
        })
        if (!file || !file.sourceFile) {
          return errorResponseBadRequest(`Invalid track_segments input - no matching source file found for segment CIDs.`)
        }
        sourceFile = file.sourceFile
      } else {
        // if sourceFile provided, ensure segmentFile exists with that sourceFile
        const file = await models.File.findOne({
          where: {
            sourceFile
          }
        })
        if (!file) {
          return errorResponseBadRequest(`Invalid sourceFile input - no matching file entry found.`)
        }
      }

      // Ensure sourceFile exists on disk.
      const fileDir = path.resolve(req.app.get('storagePath'), sourceFile.split('.')[0])
      const filePath = path.resolve(fileDir, sourceFile)
      if (!fs.existsSync(filePath)) {
        req.logger.error(`SourceFile not found at ${filePath}.`)
        return errorResponseServerError('Cannot make downloadable - no sourceFile found on disk.')
      }

      createDownloadableCopy(req, sourceFile)
    }

    // Store + pin metadata multihash to disk + IPFS.
    const metadataBuffer = Buffer.from(JSON.stringify(metadataJSON))
    const { multihash, fileUUID } = await saveFileFromBuffer(req, metadataBuffer, 'metadata')

    return successResponse({ 'metadataMultihash': multihash, 'metadataFileUUID': fileUUID })
  }))

  /**
   * Given track blockchainTrackId, blockNumber, and metadataFileUUID, creates/updates Track DB track entry
   * and associates segment & image file entries with track. Ends track creation/update process.
   */
  app.post('/tracks', authMiddleware, ensurePrimaryMiddleware, syncLockMiddleware, handleResponse(async (req, res) => {
    const { blockchainTrackId, blockNumber, metadataFileUUID } = req.body

    if (!blockchainTrackId || !blockNumber || !metadataFileUUID) {
      return errorResponseBadRequest('Must include blockchainTrackId, blockNumber, and metadataFileUUID.')
    }

    // Error on outdated blocknumber.
    const cnodeUser = req.session.cnodeUser
    if (!cnodeUser.latestBlockNumber || cnodeUser.latestBlockNumber > blockNumber) {
      return errorResponseBadRequest(`Invalid blockNumber param. Must be higher than previously processed blocknumber.`)
    }
    const cnodeUserUUID = req.session.cnodeUserUUID

    // Fetch metadataJSON for metadataFileUUID.
    const file = await models.File.findOne({ where: { fileUUID: metadataFileUUID, cnodeUserUUID } })
    if (!file) {
      return errorResponseBadRequest(`No file found for provided metadataFileUUID ${metadataFileUUID}.`)
    }
    let metadataJSON
    try {
      metadataJSON = JSON.parse(fs.readFileSync(file.storagePath))
      if (!metadataJSON || !metadataJSON.track_segments || !Array.isArray(metadataJSON.track_segments)) {
        return errorResponseServerError(`Malformatted metadataJSON stored for metadataFileUUID ${metadataFileUUID}.`)
      }
    } catch (e) {
      return errorResponseServerError(`No file stored on disk for metadataFileUUID ${metadataFileUUID} at storagePath ${file.storagePath}.`)
    }

    // Get coverArtFileUUID for multihash in metadata object, if present.
    let coverArtFileUUID
    try {
      coverArtFileUUID = await getFileUUIDForImageCID(req, metadataJSON.cover_art_sizes)
    } catch (e) {
      return errorResponseServerError(e.message)
    }

    const t = await models.sequelize.transaction()

    try {
      // Create / update track entry on db.
      const resp = (await models.Track.upsert({
        cnodeUserUUID,
        metadataFileUUID,
        metadataJSON,
        blockchainId: blockchainTrackId,
        coverArtFileUUID
      },
      { transaction: t, returning: true }
      ))
      const track = resp[0]
      const trackCreated = resp[1]

      /** Associate matching segment files on DB with new/updated track. */

      const trackSegmentCIDs = metadataJSON.track_segments.map(segment => segment.multihash)

      // if track created, ensure files exist with trackuuid = null and update them.
      if (trackCreated) {
        const trackFiles = await models.File.findAll({
          where: {
            multihash: trackSegmentCIDs,
            cnodeUserUUID,
            trackUUID: null,
            type: 'track'
          },
          transaction: t
        })
        if (trackFiles.length < trackSegmentCIDs.length) {
          throw new Error('Did not find files for every track segment CID.')
        }
        const numAffectedRows = await models.File.update(
          { trackUUID: track.trackUUID },
          { where: {
            multihash: trackSegmentCIDs,
            cnodeUserUUID,
            trackUUID: null,
            type: 'track'
          },
          transaction: t
          }
        )
        if (numAffectedRows < trackSegmentCIDs.length) {
          throw new Error('Failed to associate files for every track segment CID.')
        }
      } else { /** If track updated, ensure files exist with trackuuid. */
        const trackFiles = await models.File.findAll({
          where: {
            multihash: trackSegmentCIDs,
            cnodeUserUUID,
            trackUUID: track.trackUUID,
            type: 'track'
          },
          transaction: t
        })
        if (trackFiles.length < trackSegmentCIDs.length) {
          throw new Error('Did not find files for every track segment CID with trackUUID.')
        }
      }

      // Update cnodeUser's latestBlockNumber if higher than previous latestBlockNumber.
      // TODO - move to subquery to guarantee atomicity.
      const updatedCNodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID }, transaction: t })
      if (!updatedCNodeUser || !updatedCNodeUser.latestBlockNumber) {
        throw new Error('Issue in retrieving udpatedCnodeUser')
      }
      req.logger.info(
        `cnodeuser ${cnodeUserUUID} first latestBlockNumber ${cnodeUser.latestBlockNumber} || \
        current latestBlockNumber ${updatedCNodeUser.latestBlockNumber} || \
        given blockNumber ${blockNumber}`
      )
      if (blockNumber > updatedCNodeUser.latestBlockNumber) {
        await cnodeUser.update({ latestBlockNumber: blockNumber }, { transaction: t })
      }

      await t.commit()
      triggerSecondarySyncs(req)
      return successResponse({ trackUUID: track.trackUUID })
    } catch (e) {
      await t.rollback()
      return errorResponseServerError(e.message)
    }
  }))

  /** Returns download status of track and 320kbps CID if ready + downloadable. */
  app.get('/tracks/download_status/:blockchainId', handleResponse(async (req, res) => {
    const blockchainId = req.params.blockchainId
    if (!blockchainId) {
      return errorResponseBadRequest('Please provide blockchainId.')
    }

    const track = await models.Track.findOne({ where: { blockchainId } })
    if (!track) {
      return errorResponseBadRequest(`No track found for blockchainId ${blockchainId}`)
    }

    // Case: track is not marked as downloadable
    if (!track.metadataJSON || !track.metadataJSON.download || !track.metadataJSON.download.is_downloadable) {
      return successResponse({ isDownloadable: false, cid: null })
    }

    // Case: track is marked as downloadable
    // - Check if downloadable file exists. Since copyFile may or may not have trackUUID association,
    //    fetch a segmentFile for trackUUID, and find copyFile for segmentFile's sourceFile.
    const segmentFile = await models.File.findOne({ where: {
      type: 'track',
      trackUUID: track.trackUUID
    } })
    const copyFile = await models.File.findOne({ where: {
      type: 'copy320',
      sourceFile: segmentFile.sourceFile
    } })
    if (!copyFile) {
      return successResponse({ isDownloadable: true, cid: null })
    }

    // If copyFile exists, only return CID if it is in IPFS pinset
    try {
      await req.app.get('ipfsAPI').pin.ls(copyFile.multihash)
      return successResponse({ isDownloadable: true, cid: copyFile.multihash })
    } catch (e) {
      return successResponse({ isDownloadable: true, cid: null })
    }
  }))
}

/** Transcode track master file to 320kbps for downloading. Save to disk, IPFS, & DB. */
async function createDownloadableCopy (req, fileName) {
  try {
    const start = Date.now()
    req.logger.info(`Transcoding file ${fileName}...`)

    const fileDir = path.resolve(req.app.get('storagePath'), fileName.split('.')[0])
    const dlCopyFilePath = await ffmpeg.transcodeFileTo320(req, fileDir, fileName)

    req.logger.info(`Transcoded file ${fileName} in ${Date.now() - start}ms.`)

    await saveFileToIPFSFromFS(req, dlCopyFilePath, 'copy320', fileName)

    return dlCopyFilePath
  } catch (err) {
    req.logger.error(err)
  }
}
