const { Buffer } = require('ipfs-http-client')
const fs = require('fs')
const { promisify } = require('util')

const models = require('../models')
const { saveFileFromBufferToDisk } = require('../fileManager')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseServerError
} = require('../apiHelpers')
const { validateStateForImageDirCIDAndReturnFileUUID } = require('../utils')
const { validateMetadata } = require('../utils')
const {
  authMiddleware,
  syncLockMiddleware,
  ensurePrimaryMiddleware,
  ensureStorageMiddleware,
  issueAndWaitForSecondarySyncRequests
} = require('../middlewares')
const DBManager = require('../dbManager')

const readFile = promisify(fs.readFile)

module.exports = function (app) {
  /**
   * Create Playlist from provided metadata, and make metadata available to network
   */
  app.post(
    '/playlists/metadata',
    authMiddleware,
    ensurePrimaryMiddleware,
    ensureStorageMiddleware,
    syncLockMiddleware,
    handleResponse(async (req, res) => {
      const metadataJSON = req.body.metadata
      const metadataBuffer = Buffer.from(JSON.stringify(metadataJSON))
      const cnodeUserUUID = req.session.cnodeUserUUID
      const isValidMetadata = validateMetadata(req, metadataJSON)
      if (!isValidMetadata) {
        return errorResponseBadRequest('Invalid Playlist Metadata')
      }

      // Save file from buffer to disk
      let multihash, dstPath
      try {
        const resp = await saveFileFromBufferToDisk(req, metadataBuffer)
        multihash = resp.cid
        dstPath = resp.dstPath
      } catch (e) {
        return errorResponseServerError(
          `saveFileFromBufferToDisk op failed: ${e}`
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
          type: 'metadata'
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
        return errorResponseServerError(
          `Could not save playlist metadata to db: ${e}`
        )
      }

      // This call is not await-ed to avoid delaying or erroring
      issueAndWaitForSecondarySyncRequests(req)

      return successResponse({
        metadataMultihash: multihash,
        metadataFileUUID: fileUUID
      })
    })
  )

  /**
   * Given playlist playlistId, blockNumber, and metadataFileUUID, creates/updates Playlist DB entry
   * and associates image file entries with playlist. Ends playlist creation/update process.
   */
  app.post(
    '/playlists',
    authMiddleware,
    ensurePrimaryMiddleware,
    ensureStorageMiddleware,
    syncLockMiddleware,
    handleResponse(async (req, res) => {
      const { playlistId, blockNumber, metadataFileUUID } = req.body

      if (!playlistId || !blockNumber || !metadataFileUUID) {
        return errorResponseBadRequest(
          'Must include playlistId, blockNumber, and metadataFileUUID.'
        )
      }

      const cnodeUser = req.session.cnodeUser
      if (blockNumber < cnodeUser.latestBlockNumber) {
        return errorResponseBadRequest(
          `Invalid blockNumber param ${blockNumber}. Must be greater or equal to previously processed blocknumber ${cnodeUser.latestBlockNumber}.`
        )
      }

      const cnodeUserUUID = req.session.cnodeUserUUID

      // Fetch metadataJSON for metadataFileUUID.
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
        const fileBuffer = await readFile(file.storagePath)
        metadataJSON = JSON.parse(fileBuffer)
      } catch (e) {
        return errorResponseServerError(
          `No file stored on disk for metadataFileUUID ${metadataFileUUID} at storagePath ${file.storagePath}: ${e}.`
        )
      }

      // Get coverArtFileUUID for multihashes in metadata object, if present.
      let coverArtFileUUID
      try {
        coverArtFileUUID = await validateStateForImageDirCIDAndReturnFileUUID(
          req,
          metadataJSON.cover_photo_sizes
        )
      } catch (e) {
        return errorResponseBadRequest(e.message)
      }

      // Record Playlist entry + update CNodeUser entry in DB
      const transaction = await models.sequelize.transaction()
      try {
        const createPlaylistQueryObj = {
          metadataFileUUID,
          metadataJSON,
          playlistId,
          coverArtFileUUID
        }
        await DBManager.createNewDataRecord(
          createPlaylistQueryObj,
          cnodeUserUUID,
          models.Playlist,
          transaction
        )

        // Update cnodeUser.latestBlockNumber
        await cnodeUser.update(
          { latestBlockNumber: blockNumber },
          { transaction }
        )

        await transaction.commit()

        await issueAndWaitForSecondarySyncRequests(req)

        return successResponse()
      } catch (e) {
        await transaction.rollback()
        return errorResponseServerError(e.message)
      }
    })
  )
}
