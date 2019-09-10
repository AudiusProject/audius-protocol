const { Buffer } = require('ipfs-http-client')
const fs = require('fs')

const models = require('../models')
const authMiddleware = require('../authMiddleware')
const nodeSyncMiddleware = require('../redis').nodeSyncMiddleware
const { saveFileFromBuffer } = require('../fileManager')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const { getFileUUIDForImageCID } = require('../utils')
const { preMiddleware, postMiddleware } = require('../middlewares')

module.exports = function (app) {
  /** Create AudiusUser from provided metadata, and make metadata available to network. */
  app.post('/audius_users/metadata', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    // TODO - input validation
    const metadataJSON = req.body.metadata

    const metadataBuffer = Buffer.from(JSON.stringify(metadataJSON))
    const { multihash, fileUUID } = await saveFileFromBuffer(req, metadataBuffer, 'metadata')

    return successResponse({ 'metadataMultihash': multihash, 'metadataFileUUID': fileUUID })
  }))

  /**
   * Given audiusUser blockchainId, txBlockNumber, and metadataFileUUID, creates AudiusUser DB entry
   * and associates image file entries with audiusUser. Ends audiusUser creation process.
   */
  app.post('/audius_users', authMiddleware, preMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const blockchainId = req.body.blockchainUserId
    const txBlockNumber = req.body.blockNumber
    const metadataFileUUID = req.body.metadataFileUUID

    if (!blockchainId || !txBlockNumber || !metadataFileUUID) {
      return errorResponseBadRequest('Must include blockchainUserId, blockNumber, and metadataFileUUID.')
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
    } catch (e) {
      return errorResponseServerError(`No file stored on disk for metadataFileUUID ${metadataFileUUID} at storagePath ${file.storagePath}.`)
    }

    // Get coverArtFileUUID and profilePicFileUUID for multihashes in metadata object, if present.
    let coverArtFileUUID, profilePicFileUUID
    try {
      coverArtFileUUID = await getFileUUIDForImageCID(req, metadataJSON.cover_photo_sizes)
      profilePicFileUUID = await getFileUUIDForImageCID(req, metadataJSON.profile_picture_sizes)
    } catch (e) {
      return errorResponseBadRequest(e.message)
    }

    const t = await models.sequelize.transaction()

    // Create audiusUser entry on db - will fail if already present.
    const audiusUser = await models.AudiusUser.create({
      cnodeUserUUID,
      metadataFileUUID,
      metadataJSON,
      blockchainId,
      coverArtFileUUID,
      profilePicFileUUID
    }, { transaction: t })

    // Update cnodeUser's latestBlockNumber.
    await cnodeUser.update({ latestBlockNumber: txBlockNumber }, { transaction: t })

    try {
      await t.commit()
      return successResponse({ audiusUserUUID: audiusUser.audiusUserUUID })
    } catch (e) {
      await t.rollback()
      return errorResponseServerError(e.message)
    }
  }), postMiddleware)

  /**
   * Given audiusUser blockchainId, txBlockNumber, and metadataFileUUID, updates AudiusUser DB entry
   * and associates image file entries with audiusUser. Ends audiusUser update process.
   */
  app.put('/audius_users', authMiddleware, preMiddleware, nodeSyncMiddleware, handleResponse(async (req, res) => {
    const blockchainId = req.body.blockchainUserId
    const txBlockNumber = req.body.blockNumber
    const metadataFileUUID = req.body.metadataFileUUID

    if (!blockchainId || !txBlockNumber || !metadataFileUUID) {
      return errorResponseBadRequest('Must include blockchainUserId, blockNumber, and metadataFileUUID.')
    }

    // Error on outdated blocknumber.
    const cnodeUser = req.session.cnodeUser
    if (!cnodeUser.latestBlockNumber || cnodeUser.latestBlockNumber >= txBlockNumber) {
      return errorResponseBadRequest(`Invalid blockNumber param. Must be higher than previously processed blocknumber.`)
    }
    const cnodeUserUUID = req.session.cnodeUserUUID

    // Ensure audiusUser entry exists in DB.
    const audiusUser = await models.AudiusUser.findOne({ where: { blockchainId, cnodeUserUUID } })
    if (!audiusUser) return errorResponseBadRequest(`No audiusUser found for blockchainId ${blockchainId} for wallet.`)

    // Fetch metadataJSON for metadataFileUUID.
    const file = await models.File.findOne({ where: { fileUUID: metadataFileUUID, cnodeUserUUID } })
    if (!file) {
      return errorResponseBadRequest(`No file found for provided metadataFileUUID ${metadataFileUUID}.`)
    }
    let metadataJSON
    try {
      metadataJSON = JSON.parse(fs.readFileSync(file.storagePath))
    } catch (e) {
      return errorResponseServerError(`No file stored on disk for metadataFileUUID ${metadataFileUUID} at storagePath ${file.storagePath}.`)
    }

    // Get coverArtFileUUID and profilePicFileUUID for multihashes in metadata object, if present.
    let coverArtFileUUID, profilePicFileUUID
    try {
      coverArtFileUUID = await getFileUUIDForImageCID(req, metadataJSON.cover_photo_sizes)
      profilePicFileUUID = await getFileUUIDForImageCID(req, metadataJSON.profile_picture_sizes)
    } catch (e) {
      return errorResponseBadRequest(e.message)
    }

    const t = await models.sequelize.transaction()

    // Update audiusUser entry on DB - will fail if not already present.
    await audiusUser.update({
      metadataFileUUID,
      metadataJSON,
      coverArtFileUUID,
      profilePicFileUUID
    }, { transaction: t })

    // Update cnodeUser's latestBlockNumber.
    await cnodeUser.update({ latestBlockNumber: txBlockNumber }, { transaction: t })

    try {
      await t.commit()
      return successResponse({ audiusUserUUID: audiusUser.audiusUserUUID })
    } catch (e) {
      await t.rollback()
      return errorResponseServerError(e.message)
    }
  }), postMiddleware)
}
