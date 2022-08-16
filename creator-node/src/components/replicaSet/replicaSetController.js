const express = require('express')
const _ = require('lodash')

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
const {
  SyncType,
  SYNC_MODES
} = require('../../services/stateMachineManager/stateMachineConstants')
const {
  enqueueSync,
  processManualImmediateSync
} = require('./syncQueueComponentService')
const {
  generateDataForSignatureRecovery
} = require('../../services/sync/secondarySyncFromPrimaryUtils')

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
  if (
    _.isEmpty(serviceRegistry?.syncQueue) ||
    _.isEmpty(serviceRegistry?.syncImmediateQueue)
  ) {
    return errorResponseServerError('Sync Queue is not up and running yet')
  }
  const nodeConfig = serviceRegistry.nodeConfig

  const walletPublicKeys = req.body.wallet // array
  const primaryEndpoint = req.body.creator_node_endpoint // string
  const immediate = req.body.immediate === true || req.body.immediate === 'true' // boolean - default false
  const blockNumber = req.body.blockNumber // integer

  // Disable multi wallet syncs for now since in below redis logic is broken for multi wallet case
  if (walletPublicKeys.length === 0) {
    return errorResponseBadRequest(`Must provide one wallet param`)
  } else if (walletPublicKeys.length > 1) {
    return errorResponseBadRequest(
      `Multi wallet syncs are temporarily disabled`
    )
  }

  const wallet = walletPublicKeys[0]

  // If sync_type body param provided, log it (param is currently only used for logging)
  const syncType = req.body.sync_type
  if (syncType) {
    req.logger.info(
      `SyncRouteController - sync of type: ${syncType} initiated for ${wallet} from ${primaryEndpoint}`
    )
  }

  /**
   * If immediate sync requested, enqueue immediately and return response
   * Else, debounce + add sync to queue
   */
  const data = generateDataForSignatureRecovery(req.body)

  if (immediate) {
    try {
      await processManualImmediateSync({
        serviceRegistry,
        wallet,
        creatorNodeEndpoint: primaryEndpoint,
        forceResyncConfig: {
          forceResync: req.body.forceResync,
          signatureData: {
            timestamp: req.body.timestamp,
            signature: req.body.signature,
            data
          },
          wallet
        },
        forceWipe: req.body.forceWipe,
        logContext: req.logContext
      })
    } catch (e) {
      return errorResponseServerError(e)
    }
  } else {
    const debounceTime = nodeConfig.get('debounceTime')

    if (wallet in syncDebounceQueue) {
      clearTimeout(syncDebounceQueue[wallet])
      req.logger.info(
        `SyncRouteController - clear timeout of ${debounceTime}ms for ${wallet} at time ${Date.now()}`
      )
    }
    syncDebounceQueue[wallet] = setTimeout(async function () {
      await enqueueSync({
        serviceRegistry,
        wallet,
        creatorNodeEndpoint: primaryEndpoint,
        blockNumber,
        forceResyncConfig: {
          forceResync: req.body.forceResync,
          signatureData: {
            timestamp: req.body.timestamp,
            signature: req.body.signature,
            data
          },
          wallet
        },
        forceWipe: req.body.forceWipe,
        logContext: req.logContext
      })
      delete syncDebounceQueue[wallet]
    }, debounceTime)
    req.logger.info(
      `SyncRouteController - set timeout of ${debounceTime}ms for ${wallet} at time ${Date.now()}`
    )
  }

  return successResponse()
}

/**
 * Adds a job to manualSyncQueue to issue a sync to secondary with syncMode MergePrimaryAndSecondary
 * @notice This will only work if called on a primary for a user
 */
const mergePrimaryAndSecondaryController = async (req, res) => {
  const serviceRegistry = req.app.get('serviceRegistry')
  const manualSyncQueue = serviceRegistry.manualSyncQueue
  const config = serviceRegistry.nodeConfig

  const selfEndpoint = config.get('creatorNodeEndpoint')

  const wallet = req.query.wallet
  const endpoint = req.query.endpoint

  if (!wallet || !endpoint) {
    return errorResponseBadRequest(`Must provide wallet and endpoint params`)
  }

  const syncType = SyncType.Manual
  const syncMode = SYNC_MODES.MergePrimaryAndSecondary
  const immediate = true

  const syncRequestParameters = {
    baseURL: endpoint,
    url: '/sync',
    method: 'post',
    data: {
      wallet: [wallet],
      creator_node_endpoint: selfEndpoint,
      sync_type: syncType,
      immediate,
      from_manual_route: true
    }
  }

  await manualSyncQueue.add({
    syncType,
    syncMode,
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
  '/merge_primary_and_secondary',
  handleResponse(mergePrimaryAndSecondaryController)
)

module.exports = router
