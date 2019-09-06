const { Buffer } = require('ipfs-http-client')

const models = require('../models')
const authMiddleware = require('../authMiddleware')
const nodeSyncMiddleware = require('../redis').nodeSyncMiddleware
const { saveFileFromBuffer } = require('../fileManager')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const { getFileUUIDForImageCID } = require('../utils')
const { preMiddleware, postMiddleware } = require('../middlewares')

module.exports = function (app) {
  /** Create AudiusUser from provided metadata, and make metadata available to network. */
  app.post('/audius_users', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    // TODO: do some validation on metadata given
    const metadataJSON = req.body

    const metadataBuffer = Buffer.from(JSON.stringify(metadataJSON))
    const { multihash, fileUUID } = await saveFileFromBuffer(req, metadataBuffer, 'metadata')

    const audiusUserObj = {
      cnodeUserUUID: req.userId,
      metadataFileUUID: fileUUID,
      metadataJSON: metadataJSON
    }

    try {
      const coverArtFileUUID = await getFileUUIDForImageCID(req, metadataJSON.cover_photo_sizes)
      const profilePicFileUUID = await getFileUUIDForImageCID(req, metadataJSON.profile_picture_sizes)
      if (coverArtFileUUID) audiusUserObj.coverArtFileUUID = coverArtFileUUID
      if (profilePicFileUUID) audiusUserObj.profilePicFileUUID = profilePicFileUUID
    } catch (e) {
      return errorResponseBadRequest(e.message)
    }

    const audiusUser = await models.AudiusUser.create(audiusUserObj)

    return successResponse({ 'metadataMultihash': multihash, 'id': audiusUser.audiusUserUUID })
  }))

  /** Associate AudiusUser blockchain ID with existing creatornode AudiusUser to end creation process. */
  app.post('/audius_users/associate/:audiusUserUUID', authMiddleware, preMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const audiusUserUUID = req.params.audiusUserUUID
    const blockchainId = req.body.userId
    if (!blockchainId || !audiusUserUUID) {
      return errorResponseBadRequest('Must include blockchainId and audius user ID')
    }

    const audiusUser = await models.AudiusUser.findOne({ where: { audiusUserUUID, cnodeUserUUID: req.userId } })
    if (!audiusUser || audiusUser.cnodeUserUUID !== req.userId) {
      return errorResponseBadRequest('Invalid Audius user ID')
    }

    // TODO: validate that provided blockchain ID is indeed associated with
    // user wallet and metadata CID
    await audiusUser.update({
      blockchainId: blockchainId
    })

    return successResponse()
  }), postMiddleware)

  /** Update a AudiusUser. */
  app.put('/audius_users/:blockchainId', authMiddleware, preMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const blockchainId = req.params.blockchainId
    const audiusUser = await models.AudiusUser.findOne({ where: { blockchainId, cnodeUserUUID: req.userId } })

    if (!audiusUser) {
      req.logger.error('Attempting to find AudiusUser but none found', blockchainId, audiusUser)
      return errorResponseBadRequest(`Audius User doesn't exist for that blockchainId`)
    }

    // TODO: do some validation on metadata given
    const metadataJSON = req.body
    const metadataBuffer = Buffer.from(JSON.stringify(metadataJSON))

    // write to a new file so there's still a record of the old file
    const { multihash, fileUUID } = await saveFileFromBuffer(req, metadataBuffer, 'metadata')

    // Update the file to the new fileId and write the metadata blob in the json field
    let updateObj = {
      metadataJSON: metadataJSON,
      metadataFileUUID: fileUUID
    }

    try {
      const coverArtFileUUID = await getFileUUIDForImageCID(req, metadataJSON.cover_photo_sizes)
      const profilePicFileUUID = await getFileUUIDForImageCID(req, metadataJSON.profile_picture_sizes)
      if (coverArtFileUUID) updateObj.coverArtFileUUID = coverArtFileUUID
      if (profilePicFileUUID) updateObj.profilePicFileUUID = profilePicFileUUID
    } catch (e) {
      return errorResponseBadRequest(e.message)
    }

    await audiusUser.update(updateObj)

    return successResponse({ 'metadataMultihash': multihash })
  }), postMiddleware)
}
