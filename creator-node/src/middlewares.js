const promiseAny = require('promise.any')

const { sendResponse, errorResponse, errorResponseUnauthorized, errorResponseServerError, errorResponseBadRequest } = require('./apiHelpers')
const config = require('./config')
const sessionManager = require('./sessionManager')
const models = require('./models')
const utils = require('./utils')
const { hasEnoughStorageSpace } = require('./fileManager')
const { getMonitors, MONITORS } = require('./monitors/monitors')

/**
 * Ensure valid cnodeUser and session exist for provided session token
 */
async function authMiddleware (req, res, next) {
  // Get session token
  const sessionToken = req.get(sessionManager.sessionTokenHeader)
  if (!sessionToken) {
    return sendResponse(req, res, errorResponseUnauthorized('Authentication token not provided'))
  }

  // Ensure session exists for session token
  const cnodeUserUUID = await sessionManager.verifySession(sessionToken)
  if (!cnodeUserUUID) {
    return sendResponse(req, res, errorResponseUnauthorized('Invalid authentication token'))
  }

  // Ensure cnodeUser exists for session
  const cnodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID } })
  if (!cnodeUser) {
    return sendResponse(req, res, errorResponseUnauthorized('No node user exists for provided authentication token'))
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

  // Attach session object to request
  req.session = {
    cnodeUser: cnodeUser,
    wallet: cnodeUser.walletPublicKey,
    cnodeUserUUID: cnodeUserUUID,
    userId
  }
  next()
}

/** Ensure resource write access */
async function syncLockMiddleware (req, res, next) {
  if (req.session && req.session.wallet) {
    const redisClient = req.app.get('redisClient')
    const redisKey = redisClient.getNodeSyncRedisKey(req.session.wallet)
    const lockHeld = await redisClient.lock.getLock(redisKey)
    if (lockHeld) {
      return sendResponse(req, res, errorResponse(423,
        `Cannot change state of wallet ${req.session.wallet}. Node sync currently in progress.`
      ))
    }
  }
  req.logger.info(`syncLockMiddleware succeeded`)
  next()
}

/**
 * Blocks writes if node is not the primary for audiusUser associated with wallet
 */
async function ensurePrimaryMiddleware (req, res, next) {
  const start = Date.now()
  let logPrefix = '[ensurePrimaryMiddleware]'
  const logger = req.logger

  const serviceRegistry = req.app.get('serviceRegistry')
  const { nodeConfig, libs } = serviceRegistry

  if (!req.session || !req.session.wallet) {
    return sendResponse(req, res, errorResponseUnauthorized(`${logPrefix} User must be logged in`))
  }

  if (!req.session.userId) {
    return sendResponse(req, res, errorResponseBadRequest(`${logPrefix} User must specify 'User-Id' request header`))
  }
  const userId = req.session.userId

  logPrefix = `${logPrefix} [userId = ${userId}]`

  const selfSpID = nodeConfig.get('spID')
  if (!selfSpID) {
    return sendResponse(req, res, errorResponseServerError(`${logPrefix} Node failed to recover its own spID. Cannot validate user write.`))
  }

  /**
   * Fetch current user replicaSetSpIDs
   * Will throw error if selfSpID is not user primary
   */
  let replicaSetSpIDs
  try {
    replicaSetSpIDs = await getReplicaSetSpIDs({
      serviceRegistry,
      logger: req.logger,
      blockNumber: req.body.blockNumber,
      ensurePrimary: true,
      selfSpID,
      userId
    })
  } catch (e) {
    return sendResponse(req, res, errorResponseServerError(`${logPrefix} ${e.message}`))
  }

  const primarySpID = replicaSetSpIDs[0]

  // TODO there should be no need to do this validation (standardize / cleanup errors between here and in getReplicaSetSpIDs())
  if (selfSpID !== primarySpID) {
    return sendResponse(req, res, errorResponseUnauthorized(`${logPrefix} Failed. This node's spID (${selfSpID}) does not match user's primary spID on chain (${primarySpID}).`))
  }

  req.session.replicaSetSpIDs = replicaSetSpIDs
  req.session.nodeIsPrimary = true

  /**
   * Convert replicaSetSpIDs to replicaSetEndpoints for later consumption (do not error on failure)
   * Currently `req.session.creatorNodeEndpoints` is only used by `issueAndWaitForSecondarySyncRequests()`
   * There is a possibility of failing to retrieve endpoints for each spID, so the consumer of req.session.creatorNodeEndpoints must perform null checks
   */
  const allRegisteredCNodes = await utils.getAllRegisteredCNodes(libs, logger)
  const replicaSetEndpoints = replicaSetSpIDs.map(replicaSpID => {
    if (replicaSpID === selfSpID) {
      return nodeConfig.get('creatorNodeEndpoint')
    }
    // Get endpoint from registeredCNode matching current replicaSpID
    const replicaSetInfo = (allRegisteredCNodes.filter(CNodeInfo => CNodeInfo.spID === replicaSpID))[0]
    if (replicaSetInfo && replicaSetInfo.endpoint) {
      return replicaSetInfo.endpoint
    }
  })
  req.session.creatorNodeEndpoints = replicaSetEndpoints.filter(Boolean)

  req.logger.info(`${logPrefix} succeeded ${Date.now() - start} ms. creatorNodeEndpoints: ${replicaSetEndpoints}`)
  next()
}

/** Blocks writes if node has used over `maxStorageUsedPercent` of its capacity. */
async function ensureStorageMiddleware (req, res, next) {
  // Get storage data and max storage percentage allowed
  const [storagePathSize, storagePathUsed] = await getMonitors([
    MONITORS.STORAGE_PATH_SIZE,
    MONITORS.STORAGE_PATH_USED
  ])

  const maxStorageUsedPercent = config.get('maxStorageUsedPercent')

  // Check to see if CNode has enough storage
  let hasEnoughStorage = hasEnoughStorageSpace({
    storagePathSize,
    storagePathUsed,
    maxStorageUsedPercent
  })

  if (hasEnoughStorage) {
    next()
  } else {
    if (storagePathSize === null || storagePathSize === undefined || storagePathUsed === null || storagePathUsed === undefined) {
      let warnMsg = `The metrics storagePathUsed=${storagePathUsed} and/or storagePathSize=${storagePathSize} are unavailable. Continuing with request...`
      req.logger.warn(warnMsg)
      next()
    } else {
      const errorMsg = `Node is reaching storage space capacity. Current usage=${(100 * storagePathUsed / storagePathSize).toFixed(2)}% | Max usage=${maxStorageUsedPercent}%`
      req.logger.error(errorMsg)
      return sendResponse(
        req,
        res,
        errorResponseServerError(
          {
            msg: errorMsg,
            state: 'NODE_REACHED_CAPACITY'
          }
        )
      )
    }
  }
}

/**
 * Issue SyncRequests to both secondaries, and wait for at least one to sync before returning
 * @dev TODO - move out of middlewares layer
 */
async function issueAndWaitForSecondarySyncRequests (req) {
  const serviceRegistry = req.app.get('serviceRegistry')
  const { snapbackSM } = serviceRegistry

  // Parse request headers
  const pollingDurationMs = req.header('Polling-Duration-ms') || config.get('issueAndWaitForSecondarySyncRequestsPollingDurationMs')
  const enforceWriteQuorum = req.header('Enforce-Write-Quorum') || config.get('enforceWriteQuorum')

  if (config.get('manualSyncsDisabled')) {
    req.logger.info(`issueAndWaitForSecondarySyncRequests - Cannot proceed due to manualSyncsDisabled ${config.get('manualSyncsDisabled')})`)
    return
  }

  if (!req.session || !req.session.wallet) {
    req.logger.error(`issueAndWaitForSecondarySyncRequests Error - req.session.wallet missing`)
    return
  }
  const wallet = req.session.wallet

  try {
    if (!req.session.nodeIsPrimary || !req.session.creatorNodeEndpoints || !Array.isArray(req.session.creatorNodeEndpoints)) {
      req.logger.info('issueAndWaitForSecondarySyncRequests - Cannot process sync op - this node is not primary or invalid creatorNodeEndpoints.')
      return
    }

    let [primary, ...secondaries] = req.session.creatorNodeEndpoints
    secondaries = secondaries.filter(secondary => (!!secondary && _isFQDN(secondary)))

    if (primary !== config.get('creatorNodeEndpoint')) {
      throw new Error(`issueAndWaitForSecondarySyncRequests Error - Cannot process sync op since this node is not the primary for user ${wallet}. Instead found ${primary}.`)
    }

    // Fetch current clock val on primary
    const cnodeUser = await models.CNodeUser.findOne({ where: { walletPublicKey: wallet } })
    if (!cnodeUser || !cnodeUser.clock) {
      throw new Error(`issueAndWaitForSecondarySyncRequests Error - Failed to retrieve current clock value for user ${wallet} on current node.`)
    }
    const primaryClockVal = cnodeUser.clock

    const replicationStart = Date.now()
    try {
      const secondaryPromises = secondaries.map(secondary => {
        return snapbackSM.issueSyncRequestsUntilSynced(secondary, wallet, primaryClockVal, pollingDurationMs)
      })

      // Resolve as soon as first promise resolves, or reject if all promises reject
      await promiseAny(secondaryPromises)

      req.logger.info(`issueAndWaitForSecondarySyncRequests - At least one secondary successfully replicated content for user ${wallet} in ${Date.now() - replicationStart}ms`)
    } catch (e) {
      // Throw Error (ie reject content upload) if quorum is being enforced & neither secondary successfully synced new content
      if (enforceWriteQuorum) {
        throw new Error(`issueAndWaitForSecondarySyncRequests Error - Failed to reach 2/3 write quorum for user ${wallet} in ${Date.now() - replicationStart}ms`)
      }

      // if !enforceWriteQuorum or >= 1 secondary synced -> do nothing (to indicate success)
    }

    // If any error during replication, error if quorum is enforced
  } catch (e) {
    req.logger.error(`issueAndWaitForSecondarySyncRequests Error - wallet ${wallet} ||`, e.message)
    if (enforceWriteQuorum) {
      throw new Error(`issueAndWaitForSecondarySyncRequests Error - Failed to reach 2/3 write quorum for user ${wallet}`)
    }
  }
}

/**
 * Retrieves current FQDN registered on-chain with node's owner wallet
 *
 * @notice TODO - this can all be cached on startup, but we can't validate the spId on startup unless the
 *    services has been registered, and we can't register the service unless the service starts up.
 *    Bit of a chicken and egg problem here with timing of first time setup, but potential optimization here
 */
async function getOwnEndpoint ({ libs }) {
  let creatorNodeEndpoint = config.get('creatorNodeEndpoint')

  if (!creatorNodeEndpoint) {
    throw new Error('Must provide either creatorNodeEndpoint config var.')
  }

  const spId = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(creatorNodeEndpoint)

  if (!spId) {
    throw new Error('Cannot get spId for node')
  }

  const spInfo = await libs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo('content-node', spId)

  // Confirm on-chain endpoint exists and is valid FQDN
  // Error condition is met if any of the following are true
  // - No spInfo returned from chain
  // - Configured spOwnerWallet does not match on chain spOwnerWallet
  // - Configured delegateOwnerWallet does not match on chain delegateOwnerWallet
  // - Endpoint returned from chain but is an invalid FQDN, preventing successful operations
  // - Endpoint returned from chain does not match configured endpoint
  if (!spInfo ||
      !spInfo.hasOwnProperty('endpoint') ||
      (spInfo.owner.toLowerCase() !== config.get('spOwnerWallet').toLowerCase()) ||
      (spInfo.delegateOwnerWallet.toLowerCase() !== config.get('delegateOwnerWallet').toLowerCase()) ||
      (spInfo['endpoint'] && !_isFQDN(spInfo['endpoint'])) ||
      (spInfo['endpoint'] !== creatorNodeEndpoint)
  ) {
    throw new Error(`Cannot getOwnEndpoint for node. Returned from chain=${JSON.stringify(spInfo)}, configs=(creatorNodeEndpoint=${config.get('creatorNodeEndpoint')}, spOwnerWallet=${config.get('spOwnerWallet')}, delegateOwnerWallet=${config.get('delegateOwnerWallet')})`)
  }
  return spInfo['endpoint']
}

/**
 * Retrieves user replica set from discprov
 *
 * Polls discprov conditionally as follows:
 *    - If blockNumber provided, polls discprov until it has indexed that blocknumber (for up to 200 seconds)
 *    - Else if ensurePrimary required, polls discprov until it has indexed myCnodeEndpoint (for up to 60 seconds)
 *      - Errors if retrieved primary does not match myCnodeEndpoint
 *    - If neither of above conditions are met, falls back to single discprov query without polling
 *
 * @param {Object} serviceRegistry
 * @param {Object} logger
 * @param {string} wallet - wallet used to query discprov for user data
 * @param {number} blockNumber - blocknumber of eth TX preceding CN call
 * @param {string} myCnodeEndpoint - endpoint of this CN
 * @param {boolean} ensurePrimary - determines if function should error if this CN is not primary
 *
 * @returns {Array} - array of strings of replica set
 */
async function getCreatorNodeEndpoints ({ serviceRegistry, logger, wallet, blockNumber, ensurePrimary, myCnodeEndpoint }) {
  const { libs } = serviceRegistry

  logger.info(`Starting getCreatorNodeEndpoints for wallet ${wallet}`)
  const start = Date.now()

  let user = null

  if (blockNumber) {
    /**
     * If blockNumber provided, polls discprov until it has indexed that blocknumber (for up to 200 seconds)
     */
    const start2 = Date.now()

    // In total, will try for 200 seconds.
    const MaxRetries = 201
    const RetryTimeout = 1000 // 1 seconds

    let discprovBlockNumber = -1
    for (let retry = 1; retry <= MaxRetries; retry++) {
      logger.info(`getCreatorNodeEndpoints retry #${retry}/${MaxRetries} || time from start: ${Date.now() - start2} discprovBlockNumber ${discprovBlockNumber} || blockNumber ${blockNumber}`)

      try {
        const fetchedUser = await libs.User.getUsers(1, 0, null, wallet)

        if (!fetchedUser || fetchedUser.length === 0 || !fetchedUser[0].hasOwnProperty('blocknumber') || !fetchedUser[0].hasOwnProperty('track_blocknumber')) {
          throw new Error('Missing or malformatted user fetched from discprov.')
        }

        user = fetchedUser
        discprovBlockNumber = Math.max(user[0].blocknumber, user[0].track_blocknumber)

        if (discprovBlockNumber >= blockNumber) {
          break
        }
      } catch (e) { // Ignore all errors until MaxRetries exceeded.
        logger.info(e)
      }

      await utils.timeout(RetryTimeout)
      logger.info(`getCreatorNodeEndpoints AFTER TIMEOUT retry #${retry}/${MaxRetries} || time from start: ${Date.now() - start2} discprovBlockNumber ${discprovBlockNumber} || blockNumber ${blockNumber}`)
    }

    // Error if discprov doesn't return any user for wallet
    if (!user) {
      throw new Error(`Failed to retrieve user from discprov after ${MaxRetries} retries. Aborting.`)
    }

    // Error if discprov has still not indexed to target blockNumber
    if (discprovBlockNumber < blockNumber) {
      throw new Error(`Discprov still outdated after ${MaxRetries}. Discprov blocknumber ${discprovBlockNumber} requested blocknumber ${blockNumber}`)
    }
  } else if (ensurePrimary && myCnodeEndpoint) {
    /**
     * Else if ensurePrimary required, polls discprov until it has indexed myCnodeEndpoint (for up to 60 seconds)
     * Errors if retrieved primary does not match myCnodeEndpoint
     */
    logger.info(`getCreatorNodeEndpoints || no blockNumber passed, retrying until DN returns same endpoint`)

    const start2 = Date.now()

    // Will poll every sec for up to 1 minute (60 sec)
    const MaxRetries = 61
    const RetryTimeout = 1000 // 1 seconds

    let returnedPrimaryEndpoint = null
    for (let retry = 1; retry <= MaxRetries; retry++) {
      logger.info(`getCreatorNodeEndpoints retry #${retry}/${MaxRetries} || time from start: ${Date.now() - start2} myCnodeEndpoint ${myCnodeEndpoint}`)

      try {
        const fetchedUser = await libs.User.getUsers(1, 0, null, wallet)

        if (!fetchedUser || fetchedUser.length === 0 || !fetchedUser[0].hasOwnProperty('creator_node_endpoint')) {
          throw new Error('Missing or malformatted user fetched from discprov.')
        }

        user = fetchedUser
        returnedPrimaryEndpoint = (user[0].creator_node_endpoint).split(',')[0]

        if (returnedPrimaryEndpoint === myCnodeEndpoint) {
          break
        }
      } catch (e) { // Ignore all errors until MaxRetries exceeded
        logger.info(e)
      }

      await utils.timeout(RetryTimeout)
      logger.info(`getCreatorNodeEndpoints AFTER TIMEOUT retry #${retry}/${MaxRetries} || time from start: ${Date.now() - start2} myCnodeEndpoint ${myCnodeEndpoint}`)
    }

    // Error if discprov doesn't return any user for wallet
    if (!user) {
      throw new Error(`Failed to retrieve user from discprov after ${MaxRetries} retries. Aborting.`)
    }

    // Error if discprov has still not returned own endpoint as primary
    if (returnedPrimaryEndpoint !== myCnodeEndpoint) {
      throw new Error(`Discprov still hasn't returned own endpoint as primary after ${MaxRetries} retries. Discprov primary ${returnedPrimaryEndpoint} || own endpoint ${myCnodeEndpoint}`)
    }
  } else {
    /**
     * If neither of above conditions are met, falls back to single discprov query without polling
     */
    logger.info(`getCreatorNodeEndpoints || ensurePrimary === false, fetching user without retries`)
    user = await libs.User.getUsers(1, 0, null, wallet)
  }

  if (!user || user.length === 0 || !user[0].hasOwnProperty('creator_node_endpoint')) {
    throw new Error(`Invalid return data from discovery provider for user with wallet ${wallet}.`)
  }

  const endpoint = user[0]['creator_node_endpoint']
  const userReplicaSet = endpoint ? endpoint.split(',') : []

  logger.info(`getCreatorNodeEndpoints route time ${Date.now() - start}`)
  return userReplicaSet
}

/**
 * Retrieves user replica set spIDs from chain (POA.UserReplicaSetManager)
 *
 * Polls contract (via web3 provider) conditionally as follows:
 *    - If `blockNumber` provided, polls contract until it has indexed that blockNumber (for up to 200 seconds)
 *    - Else if `ensurePrimary` required, polls contract until it has indexed selfSpID as primary (for up to 60 seconds)
 *      - Errors if retrieved primary spID does not match selfSpID
 *    - If neither of above conditions are met, falls back to single contract query without polling
 *
 * @param {Object} serviceRegistry
 * @param {Object} logger
 * @param {number} userId - userId used to query chain contract
 * @param {number} blockNumber - blocknumber of eth TX preceding CN call
 * @param {string} selfSpID
 * @param {boolean} ensurePrimary - determines if function should error if this CN is not primary
 *
 * @returns {Array} - array of strings of replica set
 */
async function getReplicaSetSpIDs ({ serviceRegistry, logger, userId, blockNumber, ensurePrimary, selfSpID }) {
  const start = Date.now()
  const logPrefix = `[getReplicaSetSpIDs] [userId = ${userId}] [selfSpID = ${selfSpID}] [blockNumber = ${blockNumber}] [ensurePrimary = ${ensurePrimary}]`
  const { libs } = serviceRegistry

  // returns Object of schema { primaryId: string, secondaryIds: int[] }
  let replicaSet = null

  /**
   * If `blockNumber` provided, polls contract until it has indexed that blocknumber (for up to 200 seconds)
   */
  if (blockNumber) {
    // In total, will try for 200 seconds.
    const MAX_RETRIES = 201
    const RETRY_TIMEOUT_MS = 1000 // 1 seconds

    let errorMsg = null
    let blockNumberIndexed = false
    for (let retry = 1; retry <= MAX_RETRIES; retry++) {
      logger.info(`${logPrefix} retry #${retry}/${MAX_RETRIES} || time from start: ${Date.now() - start}. Polling until blockNumber ${blockNumber}.`)

      try {
        // will throw error if blocknumber not found
        replicaSet = await libs.contracts.UserReplicaSetManagerClient.getUserReplicaSetAtBlockNumber(userId, blockNumber)
        errorMsg = null
        blockNumberIndexed = true
        break
      } catch (e) { errorMsg = e.message } // Ignore all errors until MAX_RETRIES exceeded

      await utils.timeout(RETRY_TIMEOUT_MS)
    }

    // Error if indexed blockNumber but didn't find any replicaSet for user
    if (blockNumberIndexed && (!replicaSet || !replicaSet.hasOwnProperty('primaryId') || !replicaSet.primaryId)) {
      throw new Error(`${logPrefix} ERROR || Failed to retrieve user from UserReplicaSetManager after ${MAX_RETRIES} retries. Aborting.`)
    }

    // Error if failed to index target blockNumber
    if (!blockNumberIndexed) {
      throw new Error(`${logPrefix} ERROR || Web3 provider failed to index target blockNumber ${blockNumber} after ${MAX_RETRIES} retries. Aborting. Error ${errorMsg}`)
    }
  } else if (ensurePrimary && selfSpID) {
    /**
     * If ensurePrimary required but no blockNumber provided, poll URSM until returned primary = selfSpID
     * Error if still mismatched after specified timeout
     */

    // Will poll every second for 60 sec
    const MAX_RETRIES = 61
    const RETRY_TIMEOUT_MS = 1000 // 1 sec

    let errorMsg = null
    for (let retry = 1; retry <= MAX_RETRIES; retry++) {
      logger.info(`${logPrefix} retry #${retry}/${MAX_RETRIES} || time from start: ${Date.now() - start}. Polling until primaryEnsured.`)

      try {
        replicaSet = await libs.contracts.UserReplicaSetManagerClient.getUserReplicaSet(userId)

        errorMsg = null

        if (replicaSet && replicaSet.hasOwnProperty('primaryId') && replicaSet.primaryId === selfSpID) {
          break
        }
      } catch (e) { errorMsg = e.message } // Ignore all errors until MAX_RETRIES exceeded

      await utils.timeout(RETRY_TIMEOUT_MS)
    }

    // Error if failed to retrieve replicaSet
    if (!replicaSet || !replicaSet.hasOwnProperty('primaryId') || !replicaSet.primaryId) {
      throw new Error(`${logPrefix} ERROR || Failed to retrieve user from UserReplicaSetManager after ${MAX_RETRIES} retries. Aborting. Error ${errorMsg}`)
    }

    // Error if returned primary spID does not match self spID
    if (replicaSet.primaryId !== selfSpID) {
      throw new Error(`${logPrefix} ERROR || After ${MAX_RETRIES} retries, found different primary (${replicaSet.primaryId}) for user. Aborting.`)
    }
  } else {
    /**
     * If neither of above conditions are met, falls back to single chain call without polling
     */

    logger.info(`${logPrefix} ensurePrimary = false, fetching user replicaSet without retries`)

    let errorMsg = null
    try {
      replicaSet = await libs.contracts.UserReplicaSetManagerClient.getUserReplicaSet(userId)
    } catch (e) { errorMsg = e.message }

    if (!replicaSet || !replicaSet.hasOwnProperty('primaryId') || !replicaSet.primaryId) {
      throw new Error(`${logPrefix} ERROR || Failed to retrieve user from UserReplicaSetManager. Aborting. Error ${errorMsg}`)
    }
  }

  const userReplicaSetSpIDs = [replicaSet.primaryId, ...replicaSet.secondaryIds]

  logger.info(`${logPrefix} completed in ${Date.now() - start}. userReplicaSetSpIDs = [${userReplicaSetSpIDs}]`)
  return userReplicaSetSpIDs
}

// Regular expression to check if endpoint is a FQDN. https://regex101.com/r/kIowvx/2
function _isFQDN (url) {
  if (config.get('creatorNodeIsDebug')) return true
  const FQDN = new RegExp(/(?:^|[ \t])((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/gm)
  return FQDN.test(url)
}

module.exports = {
  authMiddleware,
  ensurePrimaryMiddleware,
  ensureStorageMiddleware,
  issueAndWaitForSecondarySyncRequests,
  syncLockMiddleware,
  getOwnEndpoint,
  getCreatorNodeEndpoints
}
