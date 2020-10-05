const { handleResponse, successResponse, errorResponse, recoverWallet, errorResponseUnauthorized } = require('../apiHelpers')
const BlacklistManager = require('../blacklistManager')
const config = require('../config')

module.exports = function (app) {
  /**
   * Retrieves all blacklisted tracksIds and userIds
  */
  app.get('/blacklist', handleResponse(async (req, res) => {
    const idsToBlacklist = await BlacklistManager.getTrackAndUserIdsToBlacklist()
    return successResponse(idsToBlacklist)
  }))

  /**
   * 1. Verifies that request is from authenticated user
   * 2. If so, add a track or user id to ContentBlacklist
   */
  app.post('/blacklist/add', handleResponse(async (req, res) => {
    let { id, type, timestamp, signature } = req.query
    id = parseInt(id)

    try {
      verifyRequest({ id, type, timestamp }, signature)
    } catch (e) {
      return errorResponseUnauthorized(e.mesage)
    }

    // Add entry to ContentBlacklist table via BlacklistManager
    let resp
    try {
      resp = await BlacklistManager.addToDb({ id, type })
    } catch (e) {
      return errorResponse(500, e.message)
    }

    // Add to redis blacklist via BlacklistManager
    if (resp) {
      switch (resp.type) {
        case 'USER': {
          BlacklistManager.add([], [id])
          break
        }
        case 'TRACK': {
          BlacklistManager.add([id])
          break
        }
      }
    }

    return successResponse({ type, id })
  }))

  /**
   * 1. Verifies that request is from authenticated user
   * 2. If so, remove a track or user id in ContentBlacklist and redis
   */
  app.post('/blacklist/delete', handleResponse(async (req, res) => {
    let { id, type, timestamp, signature } = req.query
    id = parseInt(id)

    try {
      verifyRequest({ id, type, timestamp }, signature)
    } catch (e) {
      return errorResponseUnauthorized(e.mesage)
    }

    // Remove entry from ContentBlacklist table via BlacklistManager
    let numRowsDestroyed
    try {
      numRowsDestroyed = BlacklistManager.remove({ id, type })
    } catch (e) {
      return errorResponse(500, e.message)
    }

    // Remove from redis blacklsit via BlacklistManager
    if (numRowsDestroyed) {
      req.logger.info(`Removed entry with type (${type}) and id (${id}) from the ContentBlacklist table!`)
      switch (type) {
        case 'USER': {
          BlacklistManager.remove([], [id])
          break
        }
        case 'TRACK': {
          BlacklistManager.remove([id])
          break
        }
      }
    } else {
      req.logger.info(`Entry with type (${type}) and id (${id}) does not exist in ContentBlacklist.`)
    }

    return successResponse({ type, id })
  }))
}

/**
 * Verify that the requester is authorized to make changes to ContentBlacklist
 * @param {{id: int, type: enum, timestamp: string}} obj raw data to be used in recovering the public wallet
 * @param {string} signature
 */
function verifyRequest ({ id, type, timestamp }, signature) {
  const recoveredPublicWallet = recoverWallet({ id, type, timestamp }, signature)
  if (recoveredPublicWallet.toLowerCase() !== config.get('delegateOwnerWallet').toLowerCase()) {
    throw new Error("Requester's public key does does not match Creator Node's delegate owner wallet.")
  }
}
