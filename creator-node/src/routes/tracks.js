const path = require('path')

const ffmpeg = require('../ffmpeg')
const ffprobe = require('../ffprobe')

const models = require('../models')
const authMiddleware = require('../authMiddleware')
const nodeSyncMiddleware = require('../redis').nodeSyncMiddleware
const { saveFileFromBuffer, saveFileToIPFSFromFS, removeTrackFolder, trackFileUpload } = require('../fileManager')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')

module.exports = function (app) {
  /**
   * upload track segment files and make avail - will later be associated with Audius track
   * @dev - currently stores each segment twice, once under random file UUID & once under IPFS multihash
   *      - this should be addressed eventually
   */
  app.post('/track_content', authMiddleware, nodeSyncMiddleware, trackFileUpload.single('file'), handleResponse(async (req, res) => {
    if (req.fileFilterError) return errorResponseBadRequest(req.fileFilterError)

    // create and save track file segments to disk
    let segmentFilePaths
    try {
      segmentFilePaths = await ffmpeg.segmentFile(req, req.fileDir, req.fileName)
    } catch (err) {
      removeTrackFolder(req, req.fileDir)
      return errorResponseServerError(err)
    }

    // for each path, call saveFile and get back multihash; return multihash + segment duration
    // run all async ops in parallel as they are not independent
    let saveFileProms = []
    let durationProms = []
    for (let filePath of segmentFilePaths) {
      const absolutePath = path.join(req.fileDir, 'segments', filePath)
      const saveFileProm = saveFileToIPFSFromFS(req, absolutePath)
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

    return successResponse({ 'track_segments': trackSegments })
  }))

  /** given track metadata object, create track and share track metadata with network
    * - return on success: temporary ID of track
    * - return on failure: error if linked segments have not already been created via POST /track_content
    */
  app.post('/tracks', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const ipfs = req.app.get('ipfsAPI')

    // TODO - input validation
    const metadataJSON = req.body

    if (!metadataJSON.owner_id) {
      return errorResponseBadRequest('Metadata blob must include owner_id')
    }

    // get file multihashes from metadata blob; confirm each has an associated file or error
    if (!metadataJSON.track_segments) {
      return errorResponseBadRequest("Metadata blob must include list of multihashes as 'segments'")
    }

    // get single file per multihash or error if DNE
    let segmentFiles = []
    // for-await-of syntax from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
    for await (const segment of metadataJSON.track_segments) {
      // TODO[SS] error check
      //  - check if properties exist, if right format, if valid multihash, if valid duration
      const segmentMultihash = segment.multihash

      const file = await models.File.findOne({
        where: {
          multihash: segmentMultihash,
          cnodeUserUUID: req.userId
        }
      })
      if (!file) {
        return errorResponseBadRequest(`No file found for provided segment multihash: ${segmentMultihash}`)
      }
      segmentFiles.push(file)
    }

    // store metadata multihash
    const metadataBuffer = ipfs.types.Buffer.from(JSON.stringify(metadataJSON))
    const { multihash, fileUUID } = await saveFileFromBuffer(req, metadataBuffer)

    // build track object for db storage
    const trackObj = {
      cnodeUserUUID: req.userId,
      metadataFileUUID: fileUUID,
      metadataJSON: metadataJSON
    }

    const coverArtFileMultihash = metadataJSON.cover_art
    if (coverArtFileMultihash) { // assumes Track.coverArtFileId is an optional param
      // ensure file exists for given multihash
      const imageFile = await models.File.findOne({
        where: {
          multihash: coverArtFileMultihash,
          cnodeUserUUID: req.userId
        }
      })
      if (!imageFile) {
        return errorResponseBadRequest(`No file found for provided multihash: ${coverArtFileMultihash}`)
      }
      trackObj.coverArtFileId = imageFile.id
    }

    const track = await models.Track.create(trackObj)
    console.log('track uuid', track.trackUUID)
    // associate matching segmentFiles from above with newly created track
    // models.Track.addFile() is an auto-generated function from sequelize oneToMany association
    for await (const file of segmentFiles) {
      // await track.addFile(file)
      file.trackUUID = track.trackUUID
      await file.save()
    }

    return successResponse({ 'metadataMultihash': multihash, 'id': track.trackUUID })
  }))

  /** provide track id returned from blockchain to end track creation process */
  app.post('/tracks/associate/:id', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const trackUUID = req.params.id
    const blockchainId = req.body.blockchainTrackId
    const cnodeUserUUID = req.userId

    if (!trackUUID || !blockchainId) {
      return errorResponseBadRequest('Must include blockchainId and trackId')
    }

    const track = await models.Track.findOne({ where: { trackUUID, cnodeUserUUID } })
    if (!track || track.cnodeUserUUID !== req.userId) {
      return errorResponseBadRequest('Invalid track ID')
    }

    // TODO(roneilr): validate that provided blockchain ID is indeed associated with
    // user wallet and metadata CID
    await track.update({
      blockchainId: blockchainId
    })

    return successResponse()
  }))

  app.get('/tracks', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const tracks = await models.Track.findAll({
      where: {
        cnodeUserUUID: req.userId
      }
    })

    return successResponse({ 'tracks': tracks })
  }))

  // update a track
  app.put('/tracks/:blockchainId', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const ipfs = req.app.get('ipfsAPI')
    const blockchainId = req.params.blockchainId
    const cnodeUserUUID = req.userId

    const track = await models.Track.findOne({ where: { blockchainId, cnodeUserUUID } })

    if (!track) return errorResponseBadRequest(`Could not find track with id ${blockchainId} owned by calling user`)

    // TODO(roneilr, dmanjunath): do some validation on metadata given
    const metadataJSON = req.body

    const metadataBuffer = ipfs.types.Buffer.from(JSON.stringify(metadataJSON))

    // write to a new file so there's still a record of the old file
    const { multihash, fileUUID } = await saveFileFromBuffer(req, metadataBuffer)

    const coverArtFileMultihash = metadataJSON.cover_art
    let coverArtFileUUID = null
    if (coverArtFileMultihash) { // assumes Track.coverArtFileUUID is an optional param
      // ensure file exists for given multihash
      const imageFile = await models.File.findOne({
        where: {
          multihash: coverArtFileMultihash,
          cnodeUserUUID: req.userId
        }
      })
      if (!imageFile) {
        return errorResponseBadRequest(`No file found for provided multihash: ${coverArtFileMultihash}`)
      }
      coverArtFileUUID = imageFile.fileUUID
    }

    // Update the file to the new fileId and write the metadata blob in the json field
    let updateObj = {
      metadataJSON: metadataJSON,
      metadataFileId: fileUUID
    }
    if (coverArtFileUUID) updateObj.coverArtFileUUID = coverArtFileUUID

    await track.update(updateObj)

    return successResponse({ 'metadataMultihash': multihash })
  }))
}
