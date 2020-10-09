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

const TYPES_SET = new Set(models.ContentBlacklist.Types)
const router = express.Router()

// Controllers

const contentBlacklistGetAllController = async (req) => {
  const { trackIds, userIds } = await getAllContentBlacklist()
  return successResponse({ trackIds, userIds })
}

const contentBlacklistAddController = async (req) => {
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParams(req.query)
  } catch (e) {
    return errorResponseBadRequest(e.message)
  }

  const { type, id, timestamp, signature } = parsedQueryParams

  try {
    verifyRequest({ id, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized(e.mesage)
  }

  try {
    await addToContentBlacklist({ type, id })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  return successResponse({ type, id })
}

const contentBlacklistRemoveController = async (req) => {
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParams(req.query)
  } catch (e) {
    return errorResponseBadRequest(e.message)
  }

  const { type, id, timestamp, signature } = parsedQueryParams

  try {
    verifyRequest({ id, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized(e.mesage)
  }

  try {
    await removeFromContentBlacklist({ type, id })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  return successResponse({ type, id })
}

// Helper methods

/**
 * Parse query params. Should contain id, type, timestamp, signature
 * @param {object} queryParams
 */
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

// Routes

router.get('/blacklist', handleResponse(contentBlacklistGetAllController))
router.post('/blacklist/add', handleResponse(contentBlacklistAddController))
router.post('/blacklist/delete', handleResponse(contentBlacklistRemoveController))

module.exports = router
