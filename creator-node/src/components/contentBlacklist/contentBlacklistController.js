const express = require('express')

const {
  getAllContentBlacklist,
  addToContentBlacklist,
  removeFromContentBlacklist
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

const contentBlacklistAddController = async (req) => {
  logger.debug(`ContentBlackListController - [add] parsing query params`)
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParams(req.query)
  } catch (e) {
    return errorResponseBadRequest(`Improper blacklist input data: ${JSON.stringify(req.query)}`)
  }

  logger.debug(`ContentBlackListController - [add] verifying signature`)
  let { type, values, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ values, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized('Unauthorized user.')
  }

  if (type !== types.cid) {
    logger.debug(`ContentBlackListController - [add] checking ids existance in disc prov`)
    const libs = req.app.get('audiusLibs')
    try {
      values = await filterNonexistantIds(libs, type, values)
    } catch (e) {
      return errorResponseBadRequest(e)
    }
  }

  logger.debug(`ContentBlackListController - [add] updating blacklist`)
  try {
    values = values.map(id => id.toString())
    await addToContentBlacklist({ type, values })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  logger.debug(`ContentBlacklistController - [add] success for ${JSON.stringify({ type, values })}`)
  return successResponse({ type, values })
}

const contentBlacklistRemoveController = async (req) => {
  logger.debug(`ContentBlackListController - [remove] parsing query params`)

  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParams(req.query)
  } catch (e) {
    return errorResponseBadRequest(`Improper blacklist input data: ${JSON.stringify(req.query)}`)
  }

  logger.debug(`ContentBlackListController - [remove] verifying signature`)
  let { type, values, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ values, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized('Unauthorized user.')
  }

  if (type !== types.cid) {
    logger.debug(`ContentBlackListController - [remove] filtering out non-existant ids`)
    const libs = req.app.get('audiusLibs')
    try {
      values = await filterNonexistantIds(libs, type, values)
    } catch (e) {
      return errorResponseBadRequest(e)
    }
  }

  logger.debug(`ContentBlackListController - [remove] updating blacklist`)
  try {
    values = values.map(id => id.toString())
    await removeFromContentBlacklist({ type, values })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  logger.debug(`ContentBlacklistController - [remove] success for ${JSON.stringify({ type, values })}`)
  return successResponse({ type, values })
}

// Helper methods

/**
 * Parse query params. Should contain id, type, timestamp, signature
 * @param {Object} queryParams
 * @param {string} queryParams.type the type (user, track, cid) (paired with values)
 * @param {number[]} queryParams.values[] the ids (for tracks, users) or cids (segments)
 * @param {string} queryParams.timestamp the timestamp of when the data was signed
 */
function parseQueryParams (queryParams) {
  let { values, type, timestamp, signature } = queryParams

  if (!values || !Array.isArray(values) || values.length === 0 || !type || !timestamp || !signature) {
    throw new Error(
      `Missing query params: [values: ${values}, type: ${type}, timestamp: ${timestamp}, signature ${signature}]`
    )
  }
  type = type.toUpperCase()

  if (!TYPES_SET.has(type)) {
    throw new Error(`Improper type [${type}]`)
  }

  if (type === types.cid) {
    // Parse cids to be of Qm... syntax
    const orignalNumCIDs = values.length
    const cidRegex = new RegExp('^Qm[a-zA-Z0-9]{44}$')
    values = values.filter(cid => cidRegex.test(cid))
    if (values.length === 0) throw new Error('List of values is not proper.')
    if (orignalNumCIDs !== values.length) {
      logger.warn(`Filtered out improper values from input. Please only pass valid CIDs!`)
    }
  } else {
    // Parse ids into ints greater than 0
    const originalNumIds = values.length
    values = values.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
    if (values.length === 0) throw new Error(`List of ids is not proper: ids [${values.toString()}]`)
    if (originalNumIds !== values.length) {
      logger.warn(`Filterd out non-numeric ids from input. Please only pass integers!`)
    }
  }

  return { type, values, timestamp, signature }
}

/**
 * Verify that the requester is authorized to make changes to ContentBlacklist
 * @param {Object} data data to sign; structure of {type, values, timestamp}
 * @param {string} data.type the type (user, track, cid) (paired with ids)
 * @param {number[]} data.values[] the ids of either users or tracks, or segments
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
router.post('/blacklist/add', handleResponse(contentBlacklistAddController))
router.post('/blacklist/remove', handleResponse(contentBlacklistRemoveController))

module.exports = router
