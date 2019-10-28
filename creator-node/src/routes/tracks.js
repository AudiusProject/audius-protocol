const path = require('path')
const fs = require('fs')
const { Buffer } = require('ipfs-http-client')

const ffmpeg = require('../ffmpeg')
const { getSegmentsDuration } = require('../segmentDuration')
const models = require('../models')
const { saveFileFromBuffer, saveFileToIPFSFromFS, removeTrackFolder, trackFileUpload } = require('../fileManager')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const { getFileUUIDForImageCID } = require('../utils')
const { authMiddleware, syncLockMiddleware, ensurePrimaryMiddleware, triggerSecondarySyncs } = require('../middlewares')

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
        let response = await saveFileToIPFSFromFS(req, absolutePath, 'track', t)
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
    req.logger.info(`Time taken in /track_content for full route: ${Date.now() - routeTimeStart}ms for file ${req.fileName}`)
    return successResponse({ 'track_segments': trackSegments })
  }))

  /**
   * Given track metadata object, upload and share metadata to IPFS. Return metadata multihash if successful.
   * Error if associated track segments have not already been created and stored.
   */
  app.post('/tracks/metadata', authMiddleware, ensurePrimaryMiddleware, syncLockMiddleware, handleResponse(async (req, res) => {
    // TODO - input validation
    const metadataJSON = req.body.metadata

    if (!metadataJSON.owner_id || !metadataJSON.track_segments || !Array.isArray(metadataJSON.track_segments)) {
      return errorResponseBadRequest('Metadata object must include owner_id and track_segments array')
    }

    /** Ensure each segment multihash in metadata obj has an associated file, else error. */
    // Retrieve sourceFile from file DB entries for use in master file transcoding.
    let sourceFile = null
    await Promise.all(metadataJSON.track_segments.map(async segment => {
      const file = await models.File.findOne({ where: {
        multihash: segment.multihash,
        cnodeUserUUID: req.session.cnodeUserUUID,
        trackUUID: null,
        type: 'track'
      } })
      if (!file) {
        return errorResponseBadRequest(`No file found for provided segment multihash: ${segment.multihash}`)
      }
      if (sourceFile && file.sourceFile !== sourceFile) {
        return errorResponseBadRequest(`Invalid segment multihash: ${segment.multihash}.`)
      }
      sourceFile = file.sourceFile
    }))
    if (!sourceFile) {
      return errorResponseBadRequest(`Invalid track_segments input - no matching source file found for multihashes.`)
    }

    // If track marked as downloadable, kick off transcoding process before returning (don't block on this)
    if (metadataJSON.download && metadataJSON.download.is_downloadable) {
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
      req.logger.info(`${JSON.stringify(metadataJSON)}`)
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

    // Get download status from metadata object.
    let isDownloadable = "no"
    if (metadataJSON.download) {
      if (metadataJSON.download.isDownloadable) {
        isDownloadable = (metadataJSON.download.requires_follow) ? "follow" : "yes"
      }
    }

    const t = await models.sequelize.transaction()

    try {
      // Create / update track entry on db.
      const track = (await models.Track.upsert({
        cnodeUserUUID,
        metadataFileUUID,
        metadataJSON,
        blockchainId: blockchainTrackId,
        coverArtFileUUID,
        isDownloadable
      }, { transaction: t, returning: true }))[0]

      // Associate matching segment files on DB with new/updated track.
      await Promise.all(metadataJSON.track_segments.map(async segment => {
        // Update each segment file; error if not found.
        req.logger.info(`track uuid ${JSON.stringify(track)}`)
        const numAffectedRows = await models.File.update(
          { trackUUID: track.trackUUID },
          { where: {
            multihash: segment.multihash,
            cnodeUserUUID,
            trackUUID: null,
            type: 'track'
          },
          transaction: t
          }
        )
        req.logger.info(`num affected rows ${numAffectedRows}`)
        if (!numAffectedRows) {
          return errorResponseBadRequest(`No file found for provided segment multihash: ${segment.multihash}`)
        }
      }))

      // Update cnodeUser's latestBlockNumber if higher than previous latestBlockNumber.
      // TODO - move to subquery to guarantee atomicity.
      const updatedCNodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID }, transaction: t })
      if (!updatedCNodeUser || !updatedCNodeUser.latestBlockNumber) {
        return errorResponseServerError('Issue in retrieving udpatedCnodeUser')
      }
      req.logger.info(`cnodeuser ${cnodeUserUUID} first latestBlockNumber ${cnodeUser.latestBlockNumber} || \
        current latestBlockNumber ${updatedCNodeUser.latestBlockNumber} || given blockNumber ${blockNumber}`)
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

  /**
   * TODO
   * - consider inputting trackUUID vs trackBlockchainId
   * - middlewares?
   */
  app.get('/tracks/download_status/:blockchainId', handleResponse(async (req, res) => {
    const blockchainId = req.params.blockchainId
    if (!blockchainId) {
      return errorResponseBadRequest('Please provide blockchainId.')
    }

    const track = await models.Track.findOne({ where: { blockchainId } })

    if (!track) {
      return errorResponseBadRequest(`No track found for blockchainId ${blockchainId}`)
    }

    if (!track.metadataJSON || !track.metadataJSON.download || !track.metadataJSON.download.is_downloadable) {
      return successResponse({ isDownloadable: false, cid: null })
    }

    // If track is downloadable, find sourceFile from a segment file entry from metadataJSON
    // if copy320 file entry exists with sourceFile, return CID else return null
    const segmentFile = await models.File.findOne({ where: {
      type: "track",
      trackUUID: track.trackUUID
    }})

    copyFile = await models.File.findOne({ where: {
      type: "copy320",
      sourceFile: segmentFile.sourceFile
    }})

    if (!copyFile) {
      return successResponse({ isDownloadable: true, cid: null })
    } else {
      // Return CID if IPFS node has pinned it, else null.
      try {
        await req.app.get('ipfsAPI').pin.ls(copyFile.multihash)
        return successResponse({ isDownloadable: true, cid: copyFile.multihash })
      } catch (e) {
        return successResponse({ isDownloadable: true, cid: null })
      }
    }
  }))
}

/**
 * transcode file to 320kbps + save to disk in same fileDir
 * pin to IPFS
 * store in DB w/ CID
 */
async function createDownloadableCopy (req, sourceFile) {
  try {
    const start = Date.now()
    const sourceFilePath = path.resolve(req.app.get('storagePath'), sourceFile.split('.')[0])
    req.logger.info(`Transcoding file ${sourceFile}...`)
    const dlCopyFilePath = await ffmpeg.transcodeFileTo320(req, sourceFilePath, sourceFile)
    req.logger.info(`Transcoded file ${sourceFile} in ${Date.now() - start}ms.`)

    const resp = await saveFileToIPFSFromFS(req, dlCopyFilePath, 'copy320', null, sourceFile)
    req.logger.info(`savefiletoipfsfromfs ${JSON.stringify(resp)}`)

    return dlCopyFilePath
  } catch (err) {
    // TODO - rollback transaction
    req.logger.error(err)
  }
}
