const { handleResponse, successResponse, errorResponse, recoverWallet, errorResponseUnauthorized } = require('../apiHelpers')
const BlacklistManager = require('../blacklistManager')
const models = require('../models')
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
   * 3. If so, also add associated segments to redis
   */
  app.post('/blacklist/add', handleResponse(async (req, res) => {
    let { id, type, timestamp, signature } = req.query
    id = parseInt(id)

    // Recover public wallet of requester
    const recoveredPublicWallet = recoverWallet({ id, type, timestamp }, signature)
    if (recoveredPublicWallet.toLowerCase() !== config.get('delegateOwnerWallet').toLowerCase()) {
      // return errorResponseUnauthorized(`\n\n\nsignature: ${signature} || recovered: ${recoveredPublicWallet} || config: ${config.get('delegateOwnerWallet')}`)
      return errorResponseUnauthorized("Requester's public key does does not match Creator Node's delegate owner wallet.")
    }

    // Add entry to ContentBlacklist table
    let resp
    try {
      resp = await models.ContentBlacklist.create({ id, type })
      req.logger.info(`Added entry with type (${type}) and id (${id}) to the ContentBlacklist table!`)
    } catch (e) {
      if (!e.message.includes('Validation error')) {
        return errorResponse(500, `Error with adding entry with type (${type}) and id (${id}): ${e}`)
      }
      req.logger.info(`Entry with type (${type}) and id (${id}) already exists!`)
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
   * 3. If so, also remove associated segments from redis
   */
  app.post('/blacklist/delete', handleResponse(async (req, res) => {
    let { id, type, timestamp, signature } = req.query
    id = parseInt(id)

    // Recover public wallet of requester
    const recoveredPublicWallet = recoverWallet({ id, type, timestamp }, signature)
    if (recoveredPublicWallet.toLowerCase() !== config.get('delegateOwnerWallet').toLowerCase()) {
      // return errorResponseUnauthorized(`\n\n\nsignature: ${signature} || recovered: ${recoveredPublicWallet} || config: ${config.get('delegateOwnerWallet')}`)
      return errorResponseUnauthorized("Requester's public key does does not match Creator Node's delegate owner wallet.")
    }

    let numRowsDestroyed
    try {
      numRowsDestroyed = await models.ContentBlacklist.destroy({
        where: {
          id,
          type
        }
      })
    } catch (e) {
      return errorResponse(500, `Error with removing entry with type (${type}) and id (${id}): ${e}`)
    }

    if (numRowsDestroyed) {
      req.logger.info(`Removed entry with type (${type}) and id (${id}) to the ContentBlacklist table!`)
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
