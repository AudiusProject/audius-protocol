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
  // If validateInputData() does not return ids and type, an error is returned
  const response = await validateInputData(req, 'add')
  const { ids, type } = response
  if (!ids || !type) return response

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
  // If validateInputData() does not return ids and type, an error is returned
  const response = await validateInputData(req, 'remove')
  const { ids, type } = response
  if (!ids || !type) return response

  console.debug(`ContentBlackListController - [remove] updating blacklist`)
  try {
    await removeFromContentBlacklist({ type, ids })
  } catch (e) {
    return errorResponseServerError(e.message)
  }

  console.debug(`ContentBlacklistController - [remove] success for ${JSON.stringify({ type, ids })}`)
  return successResponse({ type, ids })
}

const validateInputData = async (req, action) => {
  console.debug(`ContentBlackListController - [${action}] parsing query params`)
  let parsedQueryParams
  try {
    parsedQueryParams = parseQueryParams(req.query)
  } catch (e) {
    return errorResponseBadRequest(`Improper blacklist input data: ${JSON.stringify(req.query)}`)
  }

  console.debug(`ContentBlackListController - [${action}] verifying signature`)
  let { type, ids, timestamp, signature } = parsedQueryParams
  try {
    verifyRequest({ ids, type, timestamp }, signature)
  } catch (e) {
    return errorResponseUnauthorized('Unauthorized user.')
  }

  console.debug(`ContentBlacklistController - [${action}] checking if ${type} id: ${ids} exist`)
  const libs = req.app.get('audiusLibs')
  let resp
  try {
    switch (type) {
      case 'USER':
        resp = await libs.User.getUsers(ids.length, 0, ids)
        // If response is empty, then no users or tracks were found. Return error response
        if (!resp || resp.length === 0) return errorResponseBadRequest(`Could not find ${type} with ids ${ids.toString()}`)
        // Else, if only some input ids were found, only blacklist the ids that were found
        if (resp.length < ids.length) ids = resp.map(user => user.user_id)
        break
      case 'TRACK':
        resp = await libs.Track.getTracks(ids.length, 0, ids)
        if (!resp || resp.length === 0) return errorResponseBadRequest(`Could not find ${type} with ids ${ids.toString()}`)
        if (resp.length < ids.length) ids = resp.map(track => track.track_id)
        break
    }
  } catch (e) {
    return errorResponseBadRequest(`Could not find ${type} with ids ${ids.toString()}: ${e.message}`)
  }

  return { type, ids }
}

// Helper methods

/**
 * Parse query params. Should contain id, type, timestamp, signature
 * @param {object} queryParams
 */
function parseQueryParams (queryParams) {
  let { ids, type, timestamp, signature } = queryParams

  if (!ids || ids.length === 0 || !type || !timestamp || !signature) {
    throw new Error('Missing query params: [ids, type, timestamp, signature]')
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
