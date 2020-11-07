const express = require('express')

const {
  getAllContentBlacklist,
  addIdsToContentBlacklist,
  removeIdsFromContentBlacklist,
  addCIDsToContentBlacklist,
  removeCIDsFromContentBlacklist
} = require('./contentBlacklistComponentService')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseUnauthorized,
  errorResponseServerError
} = require('../../apiHelpers')
const { recoverWallet } = require('../../apiSigning')
const models = require('../../../src/models')
const config = require('../../config')
const { logger } = require('../../logging')

const router = express.Router()

const types = models.ContentBlacklist.Types
const TYPES_SET = new Set([types.cid, types.user, types.track])

// Controllers

const contentBlacklistGetAllController = async (req) => {
  const blacklistedContent = await getAllContentBlacklist()
  return successResponse(blacklistedContent)
}

const contentBlacklistAddIdsController = async (req) => {
  logger.debug(`ContentBlackListController - [add ids] parsing query params`)
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParamsForIds(req.query)
  } catch (e) {
    return errorResponseBadRequest(`Improper blacklist input data: ${JSON.stringify(req.query)}`)
  }

  logger.debug(`ContentBlackListController - [add ids] verifying signature`)
  let { type, ids, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ ids, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized('Unauthorized user.')
  }

  logger.debug(`ContentBlackListController - [add ids] filtering out non-existant ids`)
  const libs = req.app.get('audiusLibs')
  try {
    ids = await filterNonexistantIds(libs, type, ids)
  } catch (e) {
    return errorResponseBadRequest(e)
  }

  logger.debug(`ContentBlackListController - [add ids] updating blacklist`)
  try {
    ids = ids.map(id => id.toString())
    await addIdsToContentBlacklist({ type, ids })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  logger.debug(`ContentBlacklistController - [add ids] success for ${JSON.stringify({ type, ids })}`)
  return successResponse({ type, ids })
}

const contentBlacklistRemoveIdsController = async (req) => {
  logger.debug(`ContentBlackListController - [remove ids] parsing query params`)
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParamsForIds(req.query)
  } catch (e) {
    return errorResponseBadRequest(`Improper blacklist input data: ${JSON.stringify(req.query)}`)
  }

  logger.debug(`ContentBlackListController - [remove ids] verifying signature`)
  let { type, ids, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ ids, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized('Unauthorized user.')
  }

  logger.debug(`ContentBlackListController - [remove ids] filtering out non-existant ids`)
  const libs = req.app.get('audiusLibs')
  try {
    ids = await filterNonexistantIds(libs, type, ids)
  } catch (e) {
    return errorResponseBadRequest(e)
  }

  logger.debug(`ContentBlackListController - [remove ids] updating blacklist`)
  try {
    ids = ids.map(id => id.toString())
    await removeIdsFromContentBlacklist({ type, ids })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  logger.debug(`ContentBlacklistController - [remove ids] success for ${JSON.stringify({ type, ids })}`)
  return successResponse({ type, ids })
}

const contentBlacklistAddCIDsController = async (req) => {
  logger.debug(`ContentBlackListController - [add cids] parsing query params`)
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParamsForCIDs(req.query)
  } catch (e) {
    return errorResponseBadRequest(`Improper blacklist input data: ${JSON.stringify(req.query)}`)
  }

  logger.debug(`ContentBlackListController - [add cids] verifying signature`)
  let { cids, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ cids, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized('Unauthorized user.')
  }

  logger.debug(`ContentBlackListController - [add cids] updating blacklist`)
  try {
    await addCIDsToContentBlacklist({ cids })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  return successResponse({ cids })
}

const contentBlacklistRemoveCIDsController = async (req) => {
  logger.debug(`ContentBlackListController - [remove cids] parsing query params`)
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParamsForCIDs(req.query)
  } catch (e) {
    return errorResponseBadRequest(`Improper blacklist input data: ${JSON.stringify(req.query)}`)
  }

  logger.debug(`ContentBlackListController - [remove cids] verifying signature`)
  let { cids, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ cids, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized('Unauthorized user.')
  }

  logger.debug(`ContentBlackListController - [remove cids] updating blacklist`)
  try {
    await removeCIDsFromContentBlacklist({ cids })
  } catch (e) {
    return errorResponseServerError(e.message)
  }
  return successResponse({ cids })
}

// Helper methods

/**
 * Parse query params. Should contain id, type, timestamp, signature
 * @param {Object} queryParams
 * @param {string} queryParams.type the type (user, track, cid) (paired with ids)
 * @param {number[]} queryParams.ids[] the ids of either users or tracks
 * @param {string} queryParams.timestamp the timestamp of when the data was signed
 */
function parseQueryParamsForIds (queryParams) {
  let { ids, type, timestamp, signature } = queryParams

  if (!ids || !Array.isArray(ids) || ids.length === 0 || !type || !timestamp || !signature) {
    throw new Error(
      `Missing query params: [ids: ${ids}, type: ${type}, timestamp: ${timestamp}, signature ${signature}]`
    )
  }
  type = type.toUpperCase()

  if (!TYPES_SET.has(type)) {
    throw new Error(`Improper type [${type}]`)
  }
  // Parse ids into ints greater than 0
  const originalNumIds = ids.length
  ids = ids.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
  if (ids.length === 0) throw new Error(`List of ids is not proper: ids [${ids.toString()}]`)
  if (originalNumIds !== ids.length) {
    logger.warn(`Filterd out non-numeric ids from input. Please only pass integers!`)
  }

  return { type, ids, timestamp, signature }
}

/**
 * Parse query params. Should contain cids, timestmap, signature
 * @param {Object} queryParams
 * @param {string[]} queryParams.cids[] the cids
 * @param {string} queryParams.timestamp the timestamp of when the data was signed
 */
function parseQueryParamsForCIDs (queryParams) {
  let { cids, timestamp, signature } = queryParams

  if (!cids || !Array.isArray(cids) || cids.length === 0 || !timestamp || !signature) {
    throw new Error(
      `Missing query params: [cids: ${cids}, timestamp: ${timestamp}, signature ${signature}]`
    )
  }
  const orignalNumCIDs = cids.length
  const cidRegex = new RegExp('^Qm[a-zA-Z0-9]{44}$')
  cids = cids.filter(cid => cidRegex.test(cid))
  if (cids.length === 0) throw new Error('List of cids is not proper.')
  if (orignalNumCIDs !== cids.length) {
    console.warn(`Filtered out improper cids from input. Please only pass valid CIDs!`)
  }

  return { cids, timestamp, signature }
}

/**
 * Verify that the requester is authorized to make changes to ContentBlacklist
 * @param {Object} data data to sign. In context of ContentBlacklist, can be {type, ids, timestamp}, or {cids, timestamp}
 * @param {string} [data.type] the type (user, track, cid) (paired with ids) -- optional
 * @param {number[]} [data.ids[]] the ids of either users or tracks -- optional
 * @param {string[]} [data.cids[]] the cids -- optional
 * @param {string} data.timestamp the timestamp of when the data was signed
 * @param {string} signature the signature generated from signing the data
 */
function verifyRequest (data, signature) {
  const recoveredPublicWallet = recoverWallet(data, signature)
  if (recoveredPublicWallet.toLowerCase() !== config.get('delegateOwnerWallet').toLowerCase()) {
    throw new Error("Requester's public key does does not match Creator Node's delegate owner wallet.")
  }
}

/**
 * Checks if ids exist in discovery provider
 * @param {Object} libs
 * @param {string} action
 * @param {string} type
 * @param {number[]} ids
 */
const filterNonexistantIds = async (libs, type, ids) => {
  let resp
  try {
    switch (type) {
      case 'USER':
        resp = await libs.User.getUsers(ids.length, 0, ids)
        // If response is empty, then no users or tracks were found. Return error response
        if (!resp || resp.length === 0) throw new Error('Users not found.')
        // Else, if only some input ids were found, only blacklist the ids that were found
        if (resp.length < ids.length) ids = resp.map(user => user.user_id)
        break
      case 'TRACK':
        resp = await libs.Track.getTracks(ids.length, 0, ids)
        if (!resp || resp.length === 0) throw new Error('Tracks not found.')
        if (resp.length < ids.length) ids = resp.map(track => track.track_id)
        break
      default:
        throw new Error('Could not recognize type.')
    }
  } catch (e) {
    throw new Error(`Could not find ${type} with ids ${ids.toString()}: ${e.message}`)
  }

  return ids
}

// Routes

router.get('/blacklist', handleResponse(contentBlacklistGetAllController))
router.post('/blacklist/add/ids', handleResponse(contentBlacklistAddIdsController))
router.post('/blacklist/remove/ids', handleResponse(contentBlacklistRemoveIdsController))
router.post('/blacklist/add/cids', handleResponse(contentBlacklistAddCIDsController))
router.post('/blacklist/remove/cids', handleResponse(contentBlacklistRemoveCIDsController))

module.exports = router
