const express = require('express')

const {
  successResponse,
  handleResponse,
  handleApiError,
  errorResponseBadRequest,
  errorResponseServerError
} = require('../../apiHelpers')
const {
  respondToURSMRequestForSignature
} = require('./URSMRegistrationComponentService')
const { ensureStorageMiddleware } = require('../../middlewares')
const { enqueueSync } = require('./syncQueueComponentService')
const secondarySyncFromPrimary = require('../../services/sync/secondarySyncFromPrimary')
const {
  JOB_NAMES,
  SyncType,
  SYNC_MODES
} = require('../../services/stateMachineManager/stateMachineConstants')

const router = express.Router()

/**
 * Dictionary tracking currently queued up syncs with debounce
 * @notice - this feature is likely to be deprecated in future as the need to debounce syncs goes away
 */
const syncDebounceQueue = {}

// Controllers

/**
 * Controller for `/ursm_request_for_signature` route
 * Calls `URSMRegistrationComponentService
 */
const respondToURSMRequestForProposalController = async (req) => {
  const serviceRegistry = req.app.get('serviceRegistry')

  const { spID, timestamp, signature } = req.query

  const logger = req.logger

  try {
    const response = await respondToURSMRequestForSignature(
      serviceRegistry,
      logger,
      spID,
      timestamp,
      signature
    )
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
 *
 * @notice Returns success regardless of sync outcome -> primary node will re-request sync if needed
 */
const syncRouteController = async (req, res) => {
  const serviceRegistry = req.app.get('serviceRegistry')
  const nodeConfig = serviceRegistry.nodeConfig

  const walletPublicKeys = req.body.wallet // array
  const creatorNodeEndpoint = req.body.creator_node_endpoint // string
  const immediate = req.body.immediate === true || req.body.immediate === 'true' // boolean - default false
  const blockNumber = req.body.blockNumber // integer
  const forceResync =
    req.body.forceResync === true || req.body.forceResync === 'true' // boolean - default false

  // Disable multi wallet syncs for now since in below redis logic is broken for multi wallet case
  if (walletPublicKeys.length === 0) {
    return errorResponseBadRequest(`Must provide one wallet param`)
  } else if (walletPublicKeys.length > 1) {
    return errorResponseBadRequest(
      `Multi wallet syncs are temporarily disabled`
    )
  }

  // If sync_type body param provided, log it (param is currently only used for logging)
  const syncType = req.body.sync_type
  if (syncType) {
    req.logger.info(
      `SyncRouteController - sync of type: ${syncType} initiated for ${walletPublicKeys} from ${creatorNodeEndpoint}`
    )
  }

  /**
   * If immediate sync requested, enqueue immediately and return response
   * Else, debounce + add sync to queue
   */
  if (immediate) {
    const errorObj = await secondarySyncFromPrimary(
      serviceRegistry,
      walletPublicKeys,
      creatorNodeEndpoint,
      blockNumber,
      forceResync
    )
    if (errorObj) {
      return errorResponseServerError(errorObj)
    }
  } else {
    const debounceTime = nodeConfig.get('debounceTime')

    for (const wallet of walletPublicKeys) {
      if (wallet in syncDebounceQueue) {
        clearTimeout(syncDebounceQueue[wallet])
        req.logger.info(
          `SyncRouteController - clear timeout of ${debounceTime}ms for ${wallet} at time ${Date.now()}`
        )
      }
      syncDebounceQueue[wallet] = setTimeout(async function () {
        await enqueueSync({
          serviceRegistry,
          walletPublicKeys: [wallet],
          creatorNodeEndpoint,
          blockNumber,
          forceResync
        })
        delete syncDebounceQueue[wallet]
      }, debounceTime)
      req.logger.info(
        `SyncRouteController - set timeout of ${debounceTime}ms for ${wallet} at time ${Date.now()}`
      )
    }
  }

  return successResponse()
}

const mergePrimaryAndSecondaryController = async (req, res) => {
  const serviceRegistry = req.app.get('serviceRegistry')
  const manualSyncQueue = serviceRegistry.manualSyncQueue
  const config = serviceRegistry.nodeConfig

  const selfEndpoint = config.get('creatorNodeEndpoint')

  const wallet = req.query.wallet
  const endpoint = req.query.endpoint

  const syncType = SyncType.Manual

  const syncRequestParameters = {
    baseURL: endpoint,
    url: '/sync',
    method: 'post',
    data: {
      wallet: [wallet],
      creator_node_endpoint: selfEndpoint,
      sync_type: syncType,
      immediate: true,
      sidtest: true
    }
  }

  await manualSyncQueue.add(JOB_NAMES.ISSUE_MANUAL_SYNC_REQUEST, {
    syncType: SyncType.Manual,
    syncMode: SYNC_MODES.MergePrimaryAndSecondary,
    syncRequestParameters
  })

  return successResponse()
}

// Routes

router.get(
  '/ursm_request_for_signature',
  handleResponse(respondToURSMRequestForProposalController)
)
router.post(
  '/sync',
  ensureStorageMiddleware,
  handleResponse(syncRouteController)
)

router.post(
  '/mergePrimaryAndSecondary',
  handleResponse(mergePrimaryAndSecondaryController)
)

module.exports = router
