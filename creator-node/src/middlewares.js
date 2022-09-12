const promiseAny = require('promise.any')

const {
  sendResponse,
  errorResponseUnauthorized,
  errorResponseServerError,
  errorResponseBadRequest
} = require('./apiHelpers')
const config = require('./config')
const sessionManager = require('./sessionManager')
const models = require('./models')
const utils = require('./utils')
const { hasEnoughStorageSpace } = require('./fileManager')
const { getMonitors, MONITORS } = require('./monitors/monitors')
const { verifyRequesterIsValidSP } = require('./apiSigning')
const BlacklistManager = require('./blacklistManager')
const {
  issueSyncRequestsUntilSynced
} = require('./services/stateMachineManager/stateReconciliation/stateReconciliationUtils')
const { instrumentTracing, tracing } = require('./tracer')
const {
  getReplicaSetSpIdsByUserId,
  replicaSetSpIdsToEndpoints
} = require('./services/ContentNodeInfoManager')

/**
 * Ensure valid cnodeUser and session exist for provided session token
 */
async function authMiddleware(req, res, next) {
  // Get session token
  const sessionToken = req.get(sessionManager.sessionTokenHeader)
  if (!sessionToken) {
    return sendResponse(
      req,
      res,
      errorResponseUnauthorized('Authentication token not provided')
    )
  }

  // Ensure session exists for session token
  const cnodeUserUUID = await sessionManager.verifySession(sessionToken)
  if (!cnodeUserUUID) {
    return sendResponse(
      req,
      res,
      errorResponseUnauthorized('Invalid authentication token')
    )
  }

  // Ensure cnodeUser exists for session
  const cnodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID } })
  if (!cnodeUser) {
    return sendResponse(
      req,
      res,
      errorResponseUnauthorized(
        'No node user exists for provided authentication token'
      )
    )
  }

  // Every libs session for a user logged into CN will pass a userId from POA.UserFactory
  let userId = req.get('User-Id')

  // Not every libs call passes this header until all clients upgrade to version 1.2.18
  // We fetch from DB as a fallback in the meantime
  if (!userId) {
    const resp = await models.AudiusUser.findOne({
      attributes: ['blockchainId'],
      where: { cnodeUserUUID }
    })
    if (resp && resp.blockchainId) {
      userId = parseInt(resp.blockchainId)
    }
  }

  const userBlacklisted = await BlacklistManager.userIdIsInBlacklist(userId)
  if (userBlacklisted) {
    return sendResponse(
      req,
      res,
      errorResponseUnauthorized('User not allowed to make changes on node')
    )
  }

  // Attach session object to request
  req.session = {
    cnodeUser: cnodeUser,
    wallet: cnodeUser.walletPublicKey,
    cnodeUserUUID: cnodeUserUUID,
    userId
  }
  next()
}

/**
 * Blocks writes if node is not the primary for audiusUser associated with wallet
 */
async function ensurePrimaryMiddleware(req, res, next) {
  const start = Date.now()
  let logPrefix = '[ensurePrimaryMiddleware]'
  const logger = req.logger

  const serviceRegistry = req.app.get('serviceRegistry')
  const { nodeConfig, libs } = serviceRegistry

  if (!req.session || !req.session.wallet) {
    return sendResponse(
      req,
      res,
      errorResponseUnauthorized(`${logPrefix} User must be logged in`)
    )
  }

  if (!req.session.userId) {
    return sendResponse(
      req,
      res,
      errorResponseBadRequest(
        `${logPrefix} User must specify 'User-Id' request header`
      )
    )
  }
  const userId = req.session.userId

  logPrefix = `${logPrefix} [userId = ${userId}]`

  const selfSpID = nodeConfig.get('spID')
  if (!selfSpID) {
    return sendResponse(
      req,
      res,
      errorResponseServerError(
        `${logPrefix} Node failed to recover its own spID. Cannot validate user write.`
      )
    )
  }

  /**
   * Fetch current user replicaSetSpIDs
   * Will throw error if selfSpID is not user primary
   */
  let replicaSetSpIDs
  try {
    replicaSetSpIDs = await getReplicaSetSpIdsByUserId({
      userReplicaSetManagerClient:
        serviceRegistry.libs.contracts.UserReplicaSetManagerClient,
      userId,
      blockNumber: req.body.blockNumber,
      ensurePrimary: true,
      selfSpId: selfSpID,
      parentLogger: req.logger
    })
  } catch (e) {
    return sendResponse(
      req,
      res,
      errorResponseServerError(`${logPrefix} ${e.message}`)
    )
  }

  req.session.replicaSetSpIDs = [
    replicaSetSpIDs.primaryId,
    replicaSetSpIDs.secondary1Id,
    replicaSetSpIDs.secondary2Id
  ]
  req.session.nodeIsPrimary = true

  /**
   * Currently `req.session.creatorNodeEndpoints` is only used by `issueAndWaitForSecondarySyncRequests()`
   * There is a possibility of failing to retrieve endpoints for each spID, so the consumer of req.session.creatorNodeEndpoints must perform null checks
   */
  req.session.creatorNodeEndpoints = await replicaSetSpIdsToEndpoints(
    replicaSetSpIDs
  )

  req.logger.info(
    `${logPrefix} succeeded ${Date.now() - start} ms. creatorNodeEndpoints: ${
      req.session.creatorNodeEndpoints
    }`
  )
  next()
}

/** Blocks writes if node has used over `maxStorageUsedPercent` of its capacity. */
async function ensureStorageMiddleware(req, res, next) {
  // Get storage data and max storage percentage allowed
  const [storagePathSize, storagePathUsed] = await getMonitors([
    MONITORS.STORAGE_PATH_SIZE,
    MONITORS.STORAGE_PATH_USED
  ])

  const maxStorageUsedPercent = config.get('maxStorageUsedPercent')

  // Check to see if CNode has enough storage
  const hasEnoughStorage = hasEnoughStorageSpace({
    storagePathSize,
    storagePathUsed,
    maxStorageUsedPercent
  })

  if (hasEnoughStorage) {
    next()
  } else {
    if (
      storagePathSize === null ||
      storagePathSize === undefined ||
      storagePathUsed === null ||
      storagePathUsed === undefined
    ) {
      const warnMsg = `The metrics storagePathUsed=${storagePathUsed} and/or storagePathSize=${storagePathSize} are unavailable. Continuing with request...`
      req.logger.warn(warnMsg)
      next()
    } else {
      const errorMsg = `Node is reaching storage space capacity. Current usage=${(
        (100 * storagePathUsed) /
        storagePathSize
      ).toFixed(2)}% | Max usage=${maxStorageUsedPercent}%`
      req.logger.error(errorMsg)
      return sendResponse(
        req,
        res,
        errorResponseServerError({
          msg: errorMsg,
          state: 'NODE_REACHED_CAPACITY'
        })
      )
    }
  }
}

/**
 * Issue sync requests to both secondaries, and wait for at least one to sync before returning.
 * If write quorum is enforced (determined by header + env var + ignoreWriteQuorum param) and no secondary
 * completes a sync in time, then the function throws an error.
 *
 * Order of precedence for determining if write quorum is enforced:
 * - If ignoreWriteQuorum param is passed, don't enforce write quorum regardless of header or env var
 * - If client passes Enforce-Write-Quorum header as false, don't enforce write quorum regardless of the enforceWriteQuorum env var
 * - If client passes Enforce-Write-Quorum header as true, enforce write quorum regardless of the enforceWriteQuorum env var
 * - If client doesn't pass Enforce-Write-Quorum header, enforce write quorum if enforceWriteQuorum env var is true
 *
 * @dev TODO - move out of middlewares layer because it's not used as middleware -- just as a function some routes call
 * @param ignoreWriteQuorum true if write quorum should not be enforced (don't fail the request if write quorum fails)
 */
async function _issueAndWaitForSecondarySyncRequests(
  req,
  ignoreWriteQuorum = false
) {
  const route = req.url.split('?')[0]
  const serviceRegistry = req.app.get('serviceRegistry')
  const { manualSyncQueue, prometheusRegistry } = serviceRegistry

  const histogram = prometheusRegistry.getMetric(
    prometheusRegistry.metricNames.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM
  )
  const endHistogramTimer = histogram.startTimer()

  // Parse request headers
  const pollingDurationMs =
    req.header('Polling-Duration-ms') ||
    config.get('issueAndWaitForSecondarySyncRequestsPollingDurationMs')
  const enforceWriteQuorumHeader = req.header('Enforce-Write-Quorum')
  const writeQuorumHeaderTrue =
    enforceWriteQuorumHeader === true || enforceWriteQuorumHeader === 'true'
  const writeQuorumHeaderFalse =
    enforceWriteQuorumHeader === false || enforceWriteQuorumHeader === 'false'
  const writeQuorumHeaderEmpty =
    !writeQuorumHeaderFalse || enforceWriteQuorumHeader === 'null'
  let enforceWriteQuorum = false

  if (!ignoreWriteQuorum) {
    if (writeQuorumHeaderTrue) enforceWriteQuorum = true
    // writeQuorumHeaderEmpty is for undefined/null/empty values where it's not explicitly false
    else if (writeQuorumHeaderEmpty && config.get('enforceWriteQuorum')) {
      enforceWriteQuorum = true
    }
  }

  // This sync request uses the manual sync queue, so we can't proceed if manual syncs are disabled
  if (config.get('manualSyncsDisabled')) {
    endHistogramTimer({
      enforceWriteQuorum: String(enforceWriteQuorum),
      ignoreWriteQuorum: String(ignoreWriteQuorum),
      route,
      result: 'failed_short_circuit'
    })
    const errorMsg = `issueAndWaitForSecondarySyncRequests Error - Cannot proceed due to manualSyncsDisabled ${config.get(
      'manualSyncsDisabled'
    )})`
    req.logger.error(errorMsg)
    if (enforceWriteQuorum) {
      throw new Error(errorMsg)
    }
    return
  }

  // Wallet is required and should've been set in auth middleware
  if (!req.session || !req.session.wallet) {
    endHistogramTimer({
      enforceWriteQuorum: String(enforceWriteQuorum),
      ignoreWriteQuorum: String(ignoreWriteQuorum),
      route,
      result: 'failed_short_circuit'
    })
    const errorMsg = `issueAndWaitForSecondarySyncRequests Error - req.session.wallet missing`
    req.logger.error(errorMsg)
    if (enforceWriteQuorum) {
      throw new Error(errorMsg)
    }
    return
  }
  const wallet = req.session.wallet

  try {
    if (
      !req.session.nodeIsPrimary ||
      !req.session.creatorNodeEndpoints ||
      !Array.isArray(req.session.creatorNodeEndpoints)
    ) {
      endHistogramTimer({
        enforceWriteQuorum: String(enforceWriteQuorum),
        ignoreWriteQuorum: String(ignoreWriteQuorum),
        route,
        result: 'failed_short_circuit'
      })
      const errorMsg =
        'issueAndWaitForSecondarySyncRequests Error - Cannot process sync op - this node is not primary or invalid creatorNodeEndpoints'
      req.logger.error(errorMsg)
      if (enforceWriteQuorum) {
        throw new Error(errorMsg)
      }
      return
    }

    let [primary, ...secondaries] = req.session.creatorNodeEndpoints
    secondaries = secondaries.filter(
      (secondary) => !!secondary && _isFQDN(secondary)
    )

    if (primary !== config.get('creatorNodeEndpoint')) {
      endHistogramTimer({
        enforceWriteQuorum: String(enforceWriteQuorum),
        ignoreWriteQuorum: String(ignoreWriteQuorum),
        route,
        result: 'failed_short_circuit'
      })
      throw new Error(
        `issueAndWaitForSecondarySyncRequests Error - Cannot process sync op since this node is not the primary for user ${wallet}. Instead found ${primary}.`
      )
    }

    // Fetch current clock val on primary
    const cnodeUser = await models.CNodeUser.findOne({
      where: { walletPublicKey: wallet }
    })
    if (!cnodeUser || !cnodeUser.clock) {
      endHistogramTimer({
        enforceWriteQuorum: String(enforceWriteQuorum),
        ignoreWriteQuorum: String(ignoreWriteQuorum),
        route,
        result: 'failed_short_circuit'
      })
      throw new Error(
        `issueAndWaitForSecondarySyncRequests Error - Failed to retrieve current clock value for user ${wallet} on current node.`
      )
    }
    const primaryClockVal = cnodeUser.clock

    const replicationStart = Date.now()
    try {
      const secondaryPromises = secondaries.map((secondary) => {
        return issueSyncRequestsUntilSynced(
          primary,
          secondary,
          wallet,
          primaryClockVal,
          pollingDurationMs,
          manualSyncQueue
        )
      })

      // Resolve as soon as first promise resolves, or reject if all promises reject
      await promiseAny(secondaryPromises)

      req.logger.info(
        `issueAndWaitForSecondarySyncRequests - At least one secondary successfully replicated content for user ${wallet} in ${
          Date.now() - replicationStart
        }ms`
      )
      endHistogramTimer({
        enforceWriteQuorum: String(enforceWriteQuorum),
        ignoreWriteQuorum: String(ignoreWriteQuorum),
        route,
        result: 'succeeded'
      })
    } catch (e) {
      endHistogramTimer({
        enforceWriteQuorum: String(enforceWriteQuorum),
        ignoreWriteQuorum: String(ignoreWriteQuorum),
        route,
        result: 'failed_sync'
      })
      const errorMsg = `issueAndWaitForSecondarySyncRequests Error - Failed to reach 2/3 write quorum for user ${wallet} in ${
        Date.now() - replicationStart
      }ms`
      req.logger.error(`${errorMsg}: ${e.message}`)

      // Throw Error (ie reject content upload) if quorum is being enforced & neither secondary successfully synced new content
      if (enforceWriteQuorum) {
        throw new Error(`${errorMsg}: ${e.message}`)
      }
      // else do nothing
    }

    // If any error during replication, error if quorum is enforced
  } catch (e) {
    endHistogramTimer({
      enforceWriteQuorum: String(enforceWriteQuorum),
      ignoreWriteQuorum: String(ignoreWriteQuorum),
      route,
      result: 'failed_uncaught_error'
    })
    req.logger.error(
      `issueAndWaitForSecondarySyncRequests Error - wallet ${wallet} ||`,
      e.message
    )
    if (enforceWriteQuorum) {
      throw new Error(
        `issueAndWaitForSecondarySyncRequests Error - Failed to reach 2/3 write quorum for user ${wallet}: ${e.message}`
      )
    }
  }
}

const issueAndWaitForSecondarySyncRequests = instrumentTracing({
  fn: _issueAndWaitForSecondarySyncRequests,
  options: {
    attributes: {
      [tracing.CODE_FILEPATH]: __filename
    }
  }
})

/**
 * Retrieves current FQDN registered on-chain with node's owner wallet
 *
 * @notice TODO - this can all be cached on startup, but we can't validate the spId on startup unless the
 *    services has been registered, and we can't register the service unless the service starts up.
 *    Bit of a chicken and egg problem here with timing of first time setup, but potential optimization here
 */
async function getOwnEndpoint({ libs }) {
  const creatorNodeEndpoint = config.get('creatorNodeEndpoint')

  if (!creatorNodeEndpoint) {
    throw new Error('Must provide either creatorNodeEndpoint config var.')
  }

  const spId =
    await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
      creatorNodeEndpoint
    )

  if (!spId) {
    throw new Error('Cannot get spId for node')
  }

  const spInfo =
    await libs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(
      'content-node',
      spId
    )

  // Confirm on-chain endpoint exists and is valid FQDN
  // Error condition is met if any of the following are true
  // - No spInfo returned from chain
  // - Configured spOwnerWallet does not match on chain spOwnerWallet
  // - Configured delegateOwnerWallet does not match on chain delegateOwnerWallet
  // - Endpoint returned from chain but is an invalid FQDN, preventing successful operations
  // - Endpoint returned from chain does not match configured endpoint
  if (
    !spInfo ||
    !spInfo.hasOwnProperty('endpoint') ||
    spInfo.owner.toLowerCase() !== config.get('spOwnerWallet').toLowerCase() ||
    spInfo.delegateOwnerWallet.toLowerCase() !==
      config.get('delegateOwnerWallet').toLowerCase() ||
    (spInfo.endpoint && !_isFQDN(spInfo.endpoint)) ||
    spInfo.endpoint !== creatorNodeEndpoint
  ) {
    throw new Error(
      `Cannot getOwnEndpoint for node. Returned from chain=${JSON.stringify(
        spInfo
      )}, configs=(creatorNodeEndpoint=${config.get(
        'creatorNodeEndpoint'
      )}, spOwnerWallet=${config.get(
        'spOwnerWallet'
      )}, delegateOwnerWallet=${config.get('delegateOwnerWallet')})`
    )
  }
  return spInfo.endpoint
}

async function ensureValidSPMiddleware(req, res, next) {
  try {
    const { timestamp, signature, spID } = req.query
    if (!timestamp || !signature || !spID) {
      throw new Error(
        `Missing values: timestamp=${timestamp}, signature=${signature}, and/or spID=${spID}`
      )
    }

    await verifyRequesterIsValidSP({
      audiusLibs: req.app.get('audiusLibs'),
      spID,
      reqTimestamp: timestamp,
      reqSignature: signature
    })
  } catch (e) {
    return sendResponse(
      req,
      res,
      errorResponseUnauthorized(`Request unauthorized -- ${e.message}`)
    )
  }

  next()
}

// Regular expression to check if endpoint is a FQDN. https://regex101.com/r/kIowvx/2
function _isFQDN(url) {
  if (config.get('creatorNodeIsDebug')) return true
  const FQDN = new RegExp(
    /(?:^|[ \t])((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/gm
  )
  return FQDN.test(url)
}

module.exports = {
  authMiddleware,
  ensurePrimaryMiddleware,
  ensureStorageMiddleware,
  ensureValidSPMiddleware,
  issueAndWaitForSecondarySyncRequests,
  getOwnEndpoint
}
