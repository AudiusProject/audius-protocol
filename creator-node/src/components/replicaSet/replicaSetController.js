const express = require('express')
const _ = require('lodash')
const uuid = require('uuid/v4')

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
  getReplicaSetSpIdsByUserId
} = require('../../services/ContentNodeInfoManager')
const {
  SyncType,
  SYNC_MODES
} = require('../../services/stateMachineManager/stateMachineConstants')
const {
  getSyncStatus,
  setSyncStatus,
  verifySPOverride
} = require('../../services/sync/syncUtil')
const {
  enqueueSync,
  processManualImmediateSync
} = require('./syncQueueComponentService')
const {
  generateDataForSignatureRecovery
} = require('../../services/sync/secondarySyncFromPrimaryUtils')
const { tracing, instrumentTracing } = require('../../tracer')

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

const getSyncStatusController = async (req, _res) => {
  try {
    const syncStatus = await getSyncStatus(req.params.syncUuid)
    return successResponse({ syncStatus })
  } catch (e) {
    return errorResponseServerError(e)
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
const _syncRouteController = async (req, _res) => {
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
  const overridePassword = req.body.overridePassword

  const syncOverride = verifySPOverride(overridePassword)

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
  const syncUuid = uuid()
  await setSyncStatus(syncUuid, 'waiting')

  if (immediate) {
    try {
      tracing.info('processing manual immediate sync')
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
        syncOverride,
        logContext: req.logContext,
        syncUuid,

        // `parentSpanContext` provides a serializable version of the span
        // which the bull queue can save on redis so that
        // the bull job can later deserialize and reference.
        parentSpanContext: tracing.currentSpanContext()
      })
    } catch (e) {
      tracing.recordException(e)
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
      tracing.info('enqueuing sync')
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
        logContext: req.logContext,
        syncOverride,
        syncUuid,
        parentSpanContext: tracing.currentSpanContext()
      })
      delete syncDebounceQueue[wallet]
    }, debounceTime)
    req.logger.info(
      `SyncRouteController - set timeout of ${debounceTime}ms for ${wallet} at time ${Date.now()}`
    )
  }

  return successResponse({ syncUuid })
}

const syncRouteController = instrumentTracing({
  fn: _syncRouteController,
  options: {
    attributes: {
      [tracing.CODE_FILEPATH]: __filename
    }
  }
})

/**
 * Adds a job to manualSyncQueue to issue a sync to secondary with syncMode MergePrimaryAndSecondary
 * @notice This will only work if called on a primary for a user
 */
const mergePrimaryAndSecondaryController = async (req, _res) => {
  const serviceRegistry = req.app.get('serviceRegistry')
  if (_.isEmpty(serviceRegistry?.recurringSyncQueue)) {
    return errorResponseServerError(
      'Recurring Sync Queue is not up and running yet'
    )
  }
  const { recurringSyncQueue, nodeConfig: config } = serviceRegistry

  const selfEndpoint = config.get('creatorNodeEndpoint')

  const wallet = req.query.wallet
  const endpoint = req.query.endpoint
  const forceWipe = req.query.forceWipe
  const syncEvenIfDisabled = req.query.syncEvenIfDisabled

  if (!wallet || !endpoint) {
    return errorResponseBadRequest(`Must provide wallet and endpoint params`)
  }

  const syncType = SyncType.Recurring
  const syncMode = forceWipe
    ? SYNC_MODES.MergePrimaryThenWipeSecondary
    : SYNC_MODES.MergePrimaryAndSecondary

  const syncRequestParameters = {
    baseURL: endpoint,
    url: '/sync',
    method: 'post',
    data: {
      wallet: [wallet],
      creator_node_endpoint: selfEndpoint,
      sync_type: syncType,
      sync_even_if_disabled: syncEvenIfDisabled,
      forceWipe: !!forceWipe
    }
  }

  await recurringSyncQueue.add(
    'recurring-sync',
    {
      syncType,
      syncMode,
      syncRequestParameters
    },
    { lifo: !!forceWipe }
  )

  return successResponse()
}

/**
 * Changes a user's replica set. Gated by`devMode` env var to only work locally.
 */
const manuallyUpdateReplicaSetController = async (req, _res) => {
  const audiusLibs = req.app.get('audiusLibs')
  const serviceRegistry = req.app.get('serviceRegistry')
  const { nodeConfig: config } = serviceRegistry

  const overridePassword = req.query.overridePassword
  const override = verifySPOverride(overridePassword)

  // If override not provided AND devMode not enabled, error
  if (!override && !config.get('devMode')) {
    return errorResponseBadRequest('This route is disabled')
  }

  const userId = parseInt(req.query.userId)
  const newPrimarySpId = parseInt(req.query.newPrimarySpId)
  const newSecondary1SpId = parseInt(req.query.newSecondary1SpId)
  const newSecondary2SpId = parseInt(req.query.newSecondary2SpId)

  if (!userId) {
    return errorResponseBadRequest(
      `Must provide userId param (the user whose replica set will be updated)`
    )
  }
  if (!newPrimarySpId || !newSecondary1SpId || !newSecondary2SpId) {
    return errorResponseBadRequest(
      'Must provide a new replica set via the following params: newPrimarySpId, newSecondary1SpId, newSecondary2SpId'
    )
  }

  const newReplicaSetSPIds = [
    newPrimarySpId,
    newSecondary1SpId,
    newSecondary2SpId
  ]
  const newSecondarySpIds = [newSecondary1SpId, newSecondary2SpId]

  const currentSpIds = await getReplicaSetSpIdsByUserId({
    libs: serviceRegistry.libs,
    userId,
    parentLogger: req.logger,
    logger: req.logger
  })

  // First try updateReplicaSet via URSM
  // Fallback to EntityManager when relay errors
  try {
    await audiusLibs.contracts.UserReplicaSetManagerClient._updateReplicaSet(
      userId,
      newPrimarySpId,
      newSecondarySpIds,
      currentSpIds.primaryId,
      currentSpIds.secondaryIds
    )

    return successResponse({ msg: 'Success via UserReplicaSetManager' })
  } catch (e) {
    if (!config.get('entityManagerReplicaSetEnabled')) {
      return errorResponseServerError(
        `Failed via UserReplicaSetManager with error ${e.message} & EntityManager disabled`
      )
    }

    const { blockNumber } = await audiusLibs.User.updateEntityManagerReplicaSet(
      {
        userId,
        primary: newPrimarySpId,
        secondaries: newSecondarySpIds,
        oldPrimary: currentSpIds.primaryId,
        oldSecondaries: currentSpIds.secondaryIds
      }
    )

    // Wait for blockhash/blockNumber to be indexed
    try {
      await audiusLibs.User.waitForReplicaSetDiscoveryIndexing(
        userId,
        newReplicaSetSPIds,
        blockNumber
      )
    } catch (e) {
      return errorResponseServerError(
        `Failed via EntityManager - Indexing unable to confirm updated replica set`
      )
    }

    return successResponse({ msg: 'Success via EntityManager' })
  }
}

// Routes

router.get(
  '/ursm_request_for_signature',
  handleResponse(respondToURSMRequestForProposalController)
)
router.get(
  '/sync_status/uuid/:syncUuid',
  handleResponse(getSyncStatusController)
)
router.post(
  '/sync',
  // Force wipe syncs will free up storage space so we want to perform them regardless of current usage
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (req, res, next) => {
    return req.body?.forceWipe
      ? next()
      : ensureStorageMiddleware(req, res, next)
  },
  handleResponse(syncRouteController)
)
router.post(
  '/merge_primary_and_secondary',
  handleResponse(mergePrimaryAndSecondaryController)
)
router.post(
  '/manually_update_replica_set',
  handleResponse(manuallyUpdateReplicaSetController)
)

module.exports = router
