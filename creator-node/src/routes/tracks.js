const path = require('path')
const fs = require('fs')
const { Buffer } = require('ipfs-http-client')

const ffmpeg = require('../ffmpeg')
const ffprobe = require('../ffprobe')
const models = require('../models')
const { saveFileFromBuffer, saveFileToIPFSFromFS, removeTrackFolder, trackFileUpload } = require('../fileManager')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const { getFileUUIDForImageCID } = require('../utils')
const { authMiddleware, syncLockMiddleware, ensurePrimaryMiddleware, triggerSecondarySyncs } = require('../middlewares')

const TRACK_CONTENT_SOCKET_TIMEOUT = 1000 * 60 * 20 // Default = 1,200,000ms = 20min

module.exports = function (app) {
  /**
   * upload track segment files and make avail - will later be associated with Audius track
   * @dev - currently stores each segment twice, once under random file UUID & once under IPFS multihash
   *      - this should be addressed eventually
   */
  app.post('/track_content', authMiddleware, ensurePrimaryMiddleware, syncLockMiddleware, trackFileUpload.single('file'), handleResponse(async (req, res) => {
    // Increase serverTimeout from default 2min to ensure large files can be uploaded.
    req.setTimeout(TRACK_CONTENT_SOCKET_TIMEOUT)

    if (req.fileFilterError) return errorResponseBadRequest(req.fileFilterError)
    const routeTimeStart = Date.now()

    // create and save track file segments to disk
    let segmentFilePaths
    try {
      req.logger.info(`Segmenting file ${req.fileName}...`)
      const segmentTimeStart = Date.now()
      segmentFilePaths = await ffmpeg.segmentFile(req, req.fileDir, req.fileName)
      req.logger.info(`Time taken to segment track file: ${Date.now() - segmentTimeStart}ms for file ${req.fileName}`)
    } catch (err) {
      removeTrackFolder(req, req.fileDir)
      return errorResponseServerError(err)
    }

    // for each path, call saveFile and get back multihash; return multihash + segment duration
    // run all async ops in parallel as they are not independent
    const saveSegmentFileTimeStart = Date.now()
    const t = await models.sequelize.transaction()
    
    req.logger.info(`segmentFilePaths.length ${segmentFilePaths.length}`)
    let counter = 1
    const saveFilePromResps = await Promise.all(segmentFilePaths.map(async filePath => {
      const absolutePath = path.join(req.fileDir, 'segments', filePath)
      req.logger.info(`about to perform saveFileToIPFSFromFS #${counter++}`)
      return saveFileToIPFSFromFS(req, absolutePath, 'track', t)
    }))
    
    let durationPromResps = []
    for (let i = 0; i < segmentFilePaths.length; i += 10) {
      const slice = segmentFilePaths.slice(i, i+10)
      req.logger.info(`about to perform ffprobe.getTrackDuration #${i}-${i+9}`)
      const resp = await Promise.all(
        slice.map(filePath => {
          const absolutePath = path.join(req.fileDir, 'segments', filePath)
          return ffprobe.getTrackDuration(req, absolutePath)
        }
      ))
      durationPromResps = durationPromResps.concat(resp)
    }

    // Commit transaction
    try {
      req.logger.info(`attempting to commit tx for file ${req.fileName}`)
      await t.commit()
    } catch (e) {
      req.logger.info(`failed to commit...rolling back. file ${req.fileName}`)
      await t.rollback()
      return errorResponseServerError(e)
    }

    let trackSegments = saveFilePromResps.map((saveFileResp, i) => {
      return { 'multihash': saveFileResp.multihash, 'duration': durationPromResps[i] }
    })
    // exclude 0-length segments that are sometimes outputted by ffmpeg segmentation
    trackSegments = trackSegments.filter(trackSegment => trackSegment.duration)

    req.logger.info(`Time taken for saving segment file to IPFS, DB and disk: ${Date.now() - saveSegmentFileTimeStart}ms for file ${req.fileName}`)
    req.logger.info(`Time taken for full track upload route: ${Date.now() - routeTimeStart}ms for file ${req.fileName}`)

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

    try {
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
