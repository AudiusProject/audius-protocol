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
  console.debug(`ContentBlackListController - [add] parsing query params`)
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParams(req.query)
  } catch (e) {
    return errorResponseBadRequest(e.message)
  }

  console.debug(`ContentBlackListController - [add] verifying signature`)
  const { type, ids, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ ids, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized(e.mesage)
  }

  console.debug(`ContentBlackListController - [add] updating blacklist`)
  try {
    await addToContentBlacklist({ type, ids })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  console.debug(`ContentBlacklistController - [add] success for ${JSON.stringify({ type, ids })}`)
  return successResponse({ type, ids })
}

const contentBlacklistRemoveController = async (req) => {
  console.debug(`ContentBlackListController - [remove] parsing query params`)
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParams(req.query)
  } catch (e) {
    return errorResponseBadRequest(e)
  }

  console.debug(`ContentBlackListController - [remove] verifying signature`)
  const { type, ids, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ ids, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized(e.mesage)
  }

  console.debug(`ContentBlackListController - [remove] updating blacklist`)
  try {
    await removeFromContentBlacklist({ type, ids })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  console.debug(`ContentBlacklistController - [remove] success for ${JSON.stringify({ type, ids })}`)
  return successResponse({ type, ids })
}

// Helper methods

/**
 * Parse query params. Should contain id, type, timestamp, signature
 * @param {object} queryParams
 */
function parseQueryParams (queryParams) {
  console.log('before parsequeryparams')
  console.log(queryParams)
  let { ids, type, timestamp, signature } = queryParams

  if (!ids || !type || !timestamp || !signature) {
    throw new Error('Missing query params: [id, type, timestamp, signature]')
  }

  type = type.toUpperCase()

  if (!TYPES_SET.has(type)) {
    throw new Error(`Improper type [${type}]`)
  }
  // Parse ids into ints greater than 0
  const numUnfilteredIds = ids.length
  ids = ids.filter(id => !isNaN(id)).map(id => parseInt(id)).filter(id => id >= 0)
  if (ids.length === 0) throw new Error('List of ids is not proper.')
  if (numUnfilteredIds !== ids.length) {
    console.warn(`Filterd out non-numeric ids from input. Please only pass integers!`)
  }

  console.log('after parsequeryparams')
  console.log({ type, ids, timestamp, signature })
  return { type, ids, timestamp, signature }
}

/**
 * Verify that the requester is authorized to make changes to ContentBlacklist
 * @param {{ids: [int], type: enum, timestamp: string}} obj raw data to be used in recovering the public wallet
 * @param {string} signature
 */
function verifyRequest ({ ids, type, timestamp }, signature) {
  const recoveredPublicWallet = recoverWallet({ ids, type, timestamp }, signature)
  if (recoveredPublicWallet.toLowerCase() !== config.get('delegateOwnerWallet').toLowerCase()) {
    throw new Error("Requester's public key does does not match Creator Node's delegate owner wallet.")
  }
}

// Routes

router.get('/blacklist', handleResponse(contentBlacklistGetAllController))
router.post('/blacklist/add', handleResponse(contentBlacklistAddController))
router.post('/blacklist/delete', handleResponse(contentBlacklistRemoveController))

module.exports = router
