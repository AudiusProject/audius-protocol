const express = require('express')

const { serviceRegistry } = require('../../serviceRegistry')
const {
  successResponse,
  handleResponse,
  handleApiError
} = require('../../apiHelpers')
const { respondToURSMRequestForSignature } = require('./URSMRegistrationComponentService')
const { ensureStorageMiddleware } = require('../../middlewares')

const router = express.Router()

// Controllers

/**
 * Controller for `/ursm_request_for_signature` route
 * Calls `URSMRegistrationComponentService
 */
const respondToURSMRequestForProposalController = async (req) => {
  const { spID, timestamp, signature } = req.query

  const logger = req.logger

  try {
    const response = await respondToURSMRequestForSignature(serviceRegistry, logger, spID, timestamp, signature)
    return successResponse(response)
  } catch (e) {
    return handleApiError(e)
  }
}

/**
 * Given walletPublicKeys array and target creatorNodeEndpoint, will request export
 * of all user data, update DB state accordingly, fetch all files and make them available.
 *
 * This route is only run on secondaries, to export and sync data from a user's primary.
 */
const syncRequestController = async (req, res) => {
  const walletPublicKeys = req.body.wallet // array
  const creatorNodeEndpoint = req.body.creator_node_endpoint // string
  const immediate = (req.body.immediate === true || req.body.immediate === 'true') // boolean

  // Disable multi wallet syncs for now since in below redis logic is broken for multi wallet case
  if (walletPublicKeys.length === 0) {
    return errorResponseBadRequest(`Must provide one wallet param`)
  } else if (walletPublicKeys.length > 1) {
    return errorResponseBadRequest(`Multi wallet syncs are temporarily disabled`)
  }

  // If sync_type body param provided, log it (param is currently only used for logging)
  const syncType = req.body.sync_type
  if (syncType) {
    req.logger.info(`SnapbackSM sync of type: ${syncType} initiated for ${walletPublicKeys} from ${creatorNodeEndpoint}`)
  }

  if (immediate) {
    let errorObj = await _nodesync(req, walletPublicKeys, creatorNodeEndpoint)
    if (errorObj) {
      return errorResponseServerError(errorObj)
    } else {
      return successResponse()
    }
  }

  // Trigger nodesync operation with debounce
  const debounceTime = config.get('debounceTime')
  for (let wallet of walletPublicKeys) {
    if (wallet in syncQueue) {
      clearTimeout(syncQueue[wallet])
      req.logger.info('clear timeout for', wallet, 'time', Date.now())
    }
    syncQueue[wallet] = setTimeout(
      async function () {
        return _nodesync(req, [wallet], creatorNodeEndpoint)
      },
      debounceTime
    )
    req.logger.info('set timeout for', wallet, 'time', Date.now())
  }

  return successResponse()
}

// Routes

router.get('/ursm_request_for_signature', handleResponse(respondToURSMRequestForProposalController))
router.get('/sync', ensureStorageMiddleware, handleResponse(syncRequestController))

module.exports = router
