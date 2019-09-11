const path = require('path')
const fs = require('fs')
const { Buffer } = require('ipfs-http-client')

const ffmpeg = require('../ffmpeg')
const ffprobe = require('../ffprobe')

const models = require('../models')
const authMiddleware = require('../authMiddleware')
const nodeSyncMiddleware = require('../redis').nodeSyncMiddleware
const { saveFileFromBuffer, saveFileToIPFSFromFS, removeTrackFolder, trackFileUpload } = require('../fileManager')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const { getFileUUIDForImageCID } = require('../utils')
const { preMiddleware, postMiddleware } = require('../middlewares')

module.exports = function (app) {
  /**
   * upload track segment files and make avail - will later be associated with Audius track
   * @dev - currently stores each segment twice, once under random file UUID & once under IPFS multihash
   *      - this should be addressed eventually
   */
  app.post('/track_content', authMiddleware, preMiddleware, nodeSyncMiddleware, trackFileUpload.single('file'), handleResponse(async (req, res) => {
    if (req.fileFilterError) return errorResponseBadRequest(req.fileFilterError)

    // create and save track file segments to disk
    let segmentFilePaths
    try {
      req.logger.info(`Segmenting file ${req.fileName}...`)
      const segmentTimeStart = Date.now()
      segmentFilePaths = await ffmpeg.segmentFile(req, req.fileDir, req.fileName)
      req.logger.info(`Segment file time: ${Date.now() - segmentTimeStart}ms`)
    } catch (err) {
      removeTrackFolder(req, req.fileDir)
      return errorResponseServerError(err)
    }

    // for each path, call saveFile and get back multihash; return multihash + segment duration
    // run all async ops in parallel as they are not independent
    const saveSegmentFileTimeStart = Date.now()
    let saveFileProms = []
    let durationProms = []
    for (let filePath of segmentFilePaths) {
      const absolutePath = path.join(req.fileDir, 'segments', filePath)
      const saveFileProm = saveFileToIPFSFromFS(req, absolutePath, 'track')
      const durationProm = ffprobe.getTrackDuration(absolutePath)
      saveFileProms.push(saveFileProm)
      durationProms.push(durationProm)
    }
    // Resolve all promises + process responses
    const [saveFilePromResps, durationPromResps] = await Promise.all(
      [saveFileProms, durationProms].map(promiseArray => Promise.all(promiseArray))
    )
    let trackSegments = saveFilePromResps.map((saveFileResp, i) => {
      return { 'multihash': saveFileResp.multihash, 'duration': durationPromResps[i] }
    })
    // exclude 0-length segments that are sometimes outputted by ffmpeg segmentation
    trackSegments = trackSegments.filter(trackSegment => trackSegment.duration)
    req.logger.info(`Save segment file time: ${Date.now() - saveSegmentFileTimeStart}ms`)

    return successResponse({ 'track_segments': trackSegments })
  }))

  /**
   * Given track metadata object, upload and share metadata to IPFS. Return metadata multihash if successful.
   * Error if associated track segments have not already been created and stored.
   */
  app.post('/tracks/metadata', authMiddleware, preMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
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
   * Given track blockchainId, txBlockNumber, and metadataFileUUID, creates Track DB track entry
   * and associates segment & image file entries with track. Ends track creation process.
   */
  app.post('/tracks', authMiddleware, preMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const blockchainId = req.body.blockchainTrackId
    const txBlockNumber = req.body.blockNumber
    const metadataFileUUID = req.body.metadataFileUUID

    if (!blockchainId || !txBlockNumber || !metadataFileUUID) {
      return errorResponseBadRequest('Must include blockchainTrackId, blockNumber, and metadataFileUUID.')
    }

    // Error on outdated blocknumber.
    const cnodeUser = req.session.cnodeUser
    if (!cnodeUser.latestBlockNumber || cnodeUser.latestBlockNumber >= txBlockNumber) {
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
    const track = await models.Track.create({
      cnodeUserUUID: cnodeUserUUID,
      metadataFileUUID,
      metadataJSON,
      blockchainId,
      coverArtFileUUID
    }, { transaction: t })

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
        transaction: t }
      )
      if (!numAffectedRows) {
        return errorResponseBadRequest(`No file found for provided segment multihash: ${segment.multihash}`)
      }
    }))

    // Update cnodeUser's latestBlockNumber.
    await cnodeUser.update({ latestBlockNumber: txBlockNumber }, { transaction: t })

    try {
      await t.commit()
      return successResponse({ trackUUID: track.trackUUID })
    } catch (e) {
      await t.rollback()
      return errorResponseServerError(e.message)
    }
  }), postMiddleware)

  /**
   * Given track blockchainId, txBlockNumber, and metadataFileUUID, updates Track DB track entry
   * and associates segment file entries with track. Ends track update process.
   */
  app.put('/tracks', authMiddleware, preMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const blockchainId = req.body.blockchainTrackId
    const txBlockNumber = req.body.blockNumber
    const metadataFileUUID = req.body.metadataFileUUID

    if (!blockchainId || !txBlockNumber || !metadataFileUUID) {
      return errorResponseBadRequest('Must include blockchainId, blockNumber, and metadataFileUUID.')
    }

    // Error on outdated blocknumber.
    const cnodeUser = req.session.cnodeUser
    if (!cnodeUser.latestBlockNumber || cnodeUser.latestBlockNumber >= txBlockNumber) {
      return errorResponseBadRequest(`Invalid blockNumber param. Must be higher than previously processed blocknumber.`)
    }
    const cnodeUserUUID = req.session.cnodeUserUUID

    // Ensure track entry exists in DB.
    const track = await models.Track.findOne({ where: { blockchainId, cnodeUserUUID } })
    if (!track) return errorResponseBadRequest(`No track found for blockchainId ${blockchainId} for wallet.`)

    // Fetch metadataJSON for metadataFileUUID
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

    // Get coverArtFileUUID for multihash found in metadata object, if present.
    let coverArtFileUUID
    try {
      coverArtFileUUID = await getFileUUIDForImageCID(req, metadataJSON.cover_art_sizes)
    } catch (e) {
      return errorResponseServerError(e.message)
    }

    const t = await models.sequelize.transaction()

    // Update track entry on db - will fail if not already present.
    await track.update({
      metadataFileUUID,
      metadataJSON,
      coverArtFileUUID
    }, { transaction: t })

    // Associate matching segment files with track.
    await Promise.all(metadataJSON.track_segments.map(async segment => {
      // Update each segment file; error if not found.
      const numAffectedRows = await models.File.update(
        { trackUUID: track.trackUUID },
        { where: {
          multihash: segment.multihash,
          cnodeUserUUID
        },
        transaction: t }
      )
      if (!numAffectedRows) {
        return errorResponseBadRequest(`No file found for provided segment multihash: ${segment.multihash}`)
      }
    }))

    // Update cnodeUser's latestBlockNumber
    await cnodeUser.update({ latestBlockNumber: txBlockNumber }, { transaction: t })

    try {
      await t.commit()
      return successResponse({ trackUUID: track.trackUUID })
    } catch (e) {
      await t.rollback()
      return errorResponseServerError(e.message)
    }
  }), postMiddleware)

  app.get('/tracks', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const tracks = await models.Track.findAll({
      where: { cnodeUserUUID: req.session.cnodeUserUUID }
    })
    return successResponse({ 'tracks': tracks })
  }))
}
