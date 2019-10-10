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
  app.post('/track_content',
    authMiddleware,
    syncLockMiddleware,
    trackFileUpload.fields([
      { name: 'file', maxCount: 1 },
      { name: 'fileSegments' }
    ]),
    handleResponse(async (req, res) => {
      if (req.fileFilterError) return errorResponseBadRequest(req.fileFilterError)
      const routeTimeStart = Date.now()
      let codeBlockTimeStart = Date.now()
      const { file: trackFiles, fileSegments } = req.files
      const trackFile = trackFiles[0]
      const trackName = trackFile.originalname
      const dirName = path.dirname(trackFile.path)
      let segmentFilePaths
      let manifestFile
      if (!fileSegments) {
      // create and save track file segments to disk
        try {
          req.logger.info(`Segmenting file ${trackName}...`)
          const ffmpegSegmentFiles = await ffmpeg.segmentFile(req, dirName, trackFile.filename, trackName)
          segmentFilePaths = ffmpegSegmentFiles.map(file => ({
            path: path.resolve(dirName, 'segments', file),
            originalname: file
          }))
          manifestFile = path.resolve(dirName, trackName.split('.')[0] + '.m3u8')
          req.logger.info(`Time taken in /track_content to segment track file: ${Date.now() - codeBlockTimeStart}ms for file ${trackName}`)
        } catch (err) {
          removeTrackFolder(req, dirName)
          return errorResponseServerError(err)
        }
      } else {
        manifestFile = fileSegments.find(file => file.originalname.endsWith('.m3u8')).path
        segmentFilePaths = fileSegments.filter(file => file.originalname.startsWith('segment'))
      }

      // for each path, call saveFile and get back multihash; return multihash + segment duration
      // run all async ops in parallel as they are not independent
      codeBlockTimeStart = Date.now()
      const t = await models.sequelize.transaction()
      let saveFilePromResps
      let segmentDurations
      try {
        let counter = 1
        saveFilePromResps = await Promise.all(segmentFilePaths
          .map(async file => {
            const absolutePath = file.path
            req.logger.info(`about to perform saveFileToIPFSFromFS #${counter++}`)

            const response = await saveFileToIPFSFromFS(req, trackFile.originalname, absolutePath, 'track', t)
            response.segmentName = file.originalname
            return response
          })
        )
        req.logger.info(`Time taken in /track_content for saving segments to IPFS: ${Date.now() - codeBlockTimeStart}ms for file ${trackName}`)

        codeBlockTimeStart = Date.now()

        segmentDurations = await getSegmentsDuration(manifestFile)
        req.logger.info(`Time taken in /track_content to get segment duration: ${Date.now() - codeBlockTimeStart}ms for file ${trackName}`)

        // Commit transaction
        codeBlockTimeStart = Date.now()
        req.logger.info(`attempting to commit tx for file ${trackName}`)
        await t.commit()
      } catch (e) {
        req.logger.info(`failed to commit...rolling back. file ${trackName}`)
        await t.rollback()
        return errorResponseServerError(e)
      }
      req.logger.info(`Time taken in /track_content to commit tx block to db: ${Date.now() - codeBlockTimeStart}ms for file ${trackName}`)

      let trackSegments = saveFilePromResps
        .map((saveFileResp, i) => {
          const segmentName = saveFileResp.segmentName
          return {
            multihash: saveFileResp.multihash,
            duration: segmentDurations[segmentName]
          }
        })
        // exclude 0-length segments that are sometimes outputted by ffmpeg segmentation
        .filter(trackSegment => trackSegment.duration)

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

    // Ensure each segment multihash in metadata obj has an associated file, else error.
    await Promise.all(metadataJSON.track_segments.map(async segment => {
      const file = await models.File.findOne({ where: {
        multihash: segment.multihash,
        cnodeUserUUID: req.session.cnodeUserUUID,
        trackUUID: null
      } })
      if (!file) {
        return errorResponseBadRequest(`No file found for provided segment multihash: ${segment.multihash}`)
      }
    }))

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
      // Create track entry on db - will fail if already present.
      const track = await models.Track.upsert({
        cnodeUserUUID,
        metadataFileUUID,
        metadataJSON,
        blockchainId: blockchainTrackId,
        coverArtFileUUID
      }, { transaction: t, returning: true })

      // Associate matching segment files on DB with newly created track.
      await Promise.all(metadataJSON.track_segments.map(async segment => {
        // Update each segment file; error if not found.
        const numAffectedRows = await models.File.update(
          { trackUUID: track.trackUUID },
          { where: {
            multihash: segment.multihash,
            cnodeUserUUID,
            trackUUID: null
          },
          transaction: t
          }
        )
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

  /** Returns all tracks for cnodeUser. */
  app.get('/tracks', authMiddleware, handleResponse(async (req, res) => {
    const tracks = await models.Track.findAll({
      where: { cnodeUserUUID: req.session.cnodeUserUUID }
    })
    return successResponse({ 'tracks': tracks })
  }))
}
