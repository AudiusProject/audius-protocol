const express = require('express')
const _ = require('lodash')
const uuid = require('uuid/v4')

const {
  successResponse,
  handleResponse,
  errorResponseBadRequest,
  errorResponseServerError
} = require('../../apiHelpers')
const { ensureStorageMiddleware } = require('../../middlewares')
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

// Routes

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

module.exports = router
