const { handleResponse, successResponse, errorResponse, recoverWallet, errorResponseUnauthorized, errorResponseBadRequest } = require('../apiHelpers')
const BlacklistManager = require('../blacklistManager')
const config = require('../config')

const TYPES_SET = new Set(['USER', 'TRACK'])

module.exports = function (app) {
  /**
   * Retrieves all blacklisted tracksIds and userIds
  */
  app.get('/blacklist', handleResponse(async (req, res) => {
    const { trackIdsToBlacklist, userIdsToBlacklist } = await BlacklistManager.getTrackAndUserIdsToBlacklist()
    return successResponse({ trackIds: trackIdsToBlacklist, userIds: userIdsToBlacklist })
  }))

  /**
   * 1. Verifies that request is from authenticated user
   * 2. If so, add a track or user id to ContentBlacklist
   */
  app.post('/blacklist/add', handleResponse(async (req, res) => {
    let parsedQueryParams
    try {
      parsedQueryParams = parseQueryParams(req.query)
    } catch (e) {
      return errorResponseBadRequest(e.message)
    }

    const { id, type, timestamp, signature } = parsedQueryParams

    try {
      verifyRequest({ id, type, timestamp }, signature)
    } catch (e) {
      return errorResponseUnauthorized(e.mesage)
    }

    // Add entry to ContentBlacklist table via BlacklistManager
    try {
      await addToBlacklist({ type, id })
    } catch (e) {
      return errorResponse(500, e.message)
    }

    return successResponse({ type, id })
  }))

  // fix this sigh
  /**
   * 1. Verifies that request is from authenticated user
   * 2. If so, remove a track or user id in ContentBlacklist and redis
   */
  app.post('/blacklist/delete', handleResponse(async (req, res) => {
    let parsedQueryParams
    try {
      parsedQueryParams = parseQueryParams(req.query)
    } catch (e) {
      return errorResponseBadRequest(e.message)
    }

    const { id, type, timestamp, signature } = parsedQueryParams

    try {
      verifyRequest({ id, type, timestamp }, signature)
    } catch (e) {
      return errorResponseUnauthorized(e.mesage)
    }

    // Remove entry from ContentBlacklist table and redis via BlacklistManager
    try {
      await removeFromBlacklist({ type, id })
    } catch (e) {
      return errorResponse(500, e.message)
    }

    return successResponse({ type, id })
  }))
}

function parseQueryParams (queryParams) {
  let { id, type, timestamp, signature } = queryParams

  if (!id || !type || !timestamp || !signature) {
    throw new Error('Missing query params: [id, type, timestamp, signature]')
  }

  type = type.toUpperCase()

  if (!TYPES_SET.has(type) || isNaN(id)) {
    throw new Error(`Improper type [${type}] or id [${id}]`)
  }

  id = parseInt(id)

  return { type, id, timestamp, signature }
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

async function removeFromBlacklist ({ type, id }) {
  let resp
  try {
    // remove from ContentBlacklist
    resp = await BlacklistManager.removeFromDb({ id, type })

    if (resp) {
      // remove from redis
      switch (resp.type) {
        case 'USER': {
          await BlacklistManager.remove([], [resp.id])
          break
        }
        case 'TRACK': {
          await BlacklistManager.remove([resp.id])
          break
        }
      }
    }
  } catch (e) {
    throw e
  }
  return resp
}

async function addToBlacklist ({ type, id }) {
  let resp
  try {
    // add to ContentBlacklist
    resp = await BlacklistManager.addToDb({ id, type })

    // add to redis
    switch (resp.type) {
      case 'USER': {
        await BlacklistManager.add([], [resp.id])
        break
      }
      case 'TRACK': {
        await BlacklistManager.add([resp.id])
        break
      }
    }
  } catch (e) {
    throw e
  }

  return resp
}
