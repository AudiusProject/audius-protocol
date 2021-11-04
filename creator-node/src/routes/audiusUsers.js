const { Buffer } = require('ipfs-http-client')
const fs = require('fs')
const { promisify } = require('util')

const config = require('../config.js')
const models = require('../models')
const { saveFileFromBufferToIPFSAndDisk } = require('../fileManager')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const { validateStateForImageDirCIDAndReturnFileUUID } = require('../utils')
const validateMetadata = require('../utils/validateAudiusUserMetadata')
const {
  authMiddleware,
  syncLockMiddleware,
  ensurePrimaryMiddleware,
  ensureStorageMiddleware,
  issueAndWaitForSecondarySyncRequests
} = require('../middlewares')
const DBManager = require('../dbManager')

const readFile = promisify(fs.readFile)

const ENABLE_IPFS_ADD_METADATA = config.get('enableIPFSAddMetadata')

module.exports = function (app) {
  /**
   * Create AudiusUser from provided metadata, and make metadata available to network
   */
  app.post('/audius_users/metadata', authMiddleware, ensurePrimaryMiddleware, ensureStorageMiddleware, syncLockMiddleware, handleResponse(async (req, res) => {
    const metadataJSON = req.body.metadata
    const metadataBuffer = Buffer.from(JSON.stringify(metadataJSON))
    const cnodeUserUUID = req.session.cnodeUserUUID
    let isValidMetadata = validateMetadata(req, metadataJSON)
    if (!isValidMetadata) {
      return errorResponseBadRequest('Invalid User Metadata')
    }

    // Save file from buffer to IPFS and disk
    let multihash, dstPath
    try {
      const resp = await saveFileFromBufferToIPFSAndDisk(req, metadataBuffer, ENABLE_IPFS_ADD_METADATA)
      multihash = resp.multihash
      dstPath = resp.dstPath
    } catch (e) {
      return errorResponseServerError(`saveFileFromBufferToIPFSAndDisk op failed: ${e}`)
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
      const file = await DBManager.createNewDataRecord(createFileQueryObj, cnodeUserUUID, models.File, transaction)
      fileUUID = file.fileUUID
      await transaction.commit()
    } catch (e) {
      await transaction.rollback()
      return errorResponseServerError(`Could not save to db: ${e}`)
    }

    return successResponse({
      'metadataMultihash': multihash,
      'metadataFileUUID': fileUUID
    })
  }))

  /**
   * Given audiusUser blockchainUserId, blockNumber, and metadataFileUUID, creates/updates AudiusUser DB entry
   * and associates image file entries with audiusUser. Ends audiusUser creation/update process.
   */
  app.post('/audius_users', authMiddleware, ensurePrimaryMiddleware, ensureStorageMiddleware, syncLockMiddleware, handleResponse(async (req, res) => {
    const { blockchainUserId, blockNumber, metadataFileUUID } = req.body

    if (!blockchainUserId || !blockNumber || !metadataFileUUID) {
      return errorResponseBadRequest('Must include blockchainUserId, blockNumber, and metadataFileUUID.')
    }

    const cnodeUser = req.session.cnodeUser
    if (blockNumber < cnodeUser.latestBlockNumber) {
      return errorResponseBadRequest(
        `Invalid blockNumber param ${blockNumber}. Must be greater or equal to previously processed blocknumber ${cnodeUser.latestBlockNumber}.`
      )
    }

    const cnodeUserUUID = req.session.cnodeUserUUID

    // Fetch metadataJSON for metadataFileUUID.
    const file = await models.File.findOne({ where: { fileUUID: metadataFileUUID, cnodeUserUUID } })
    if (!file) {
      return errorResponseBadRequest(`No file db record found for provided metadataFileUUID ${metadataFileUUID}.`)
    }
    let metadataJSON
    try {
      const fileBuffer = await readFile(file.storagePath)
      metadataJSON = JSON.parse(fileBuffer)
    } catch (e) {
      return errorResponseServerError(`No file stored on disk for metadataFileUUID ${metadataFileUUID} at storagePath ${file.storagePath}: ${e}.`)
    }

    // Get coverArtFileUUID and profilePicFileUUID for multihashes in metadata object, if present.
    let coverArtFileUUID, profilePicFileUUID
    try {
      [coverArtFileUUID, profilePicFileUUID] = await Promise.all([
        validateStateForImageDirCIDAndReturnFileUUID(req, metadataJSON.cover_photo_sizes),
        validateStateForImageDirCIDAndReturnFileUUID(req, metadataJSON.profile_picture_sizes)
      ])
    } catch (e) {
      return errorResponseBadRequest(e.message)
    }

    // Record AudiusUser entry + update CNodeUser entry in DB
    const transaction = await models.sequelize.transaction()
    try {
      const createAudiusUserQueryObj = {
        metadataFileUUID,
        metadataJSON,
        blockchainId: blockchainUserId,
        coverArtFileUUID,
        profilePicFileUUID
      }
      await DBManager.createNewDataRecord(createAudiusUserQueryObj, cnodeUserUUID, models.AudiusUser, transaction)

      // Update cnodeUser.latestBlockNumber
      await cnodeUser.update({ latestBlockNumber: blockNumber }, { transaction })

      await transaction.commit()

      await issueAndWaitForSecondarySyncRequests(req)

      return successResponse()
    } catch (e) {
      await transaction.rollback()
      return errorResponseServerError(e.message)
    }
  }))
}
