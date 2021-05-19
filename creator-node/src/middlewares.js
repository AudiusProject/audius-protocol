const { sendResponse, errorResponse, errorResponseUnauthorized, errorResponseServerError } = require('./apiHelpers')
const config = require('./config')
const sessionManager = require('./sessionManager')
const models = require('./models')
const utils = require('./utils')
const { hasEnoughStorageSpace } = require('./fileManager')
const { serviceRegistry } = require('./serviceRegistry')
const { getMonitors, MONITORS } = require('./monitors/monitors')
const { SyncType } = require('./SnapbackStateMachine/snapbackSM')

/** Ensure valid cnodeUser and session exist for provided session token. */
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

  // Attach session object to request
  req.session = {
    cnodeUser: cnodeUser,
    wallet: cnodeUser.walletPublicKey,
    cnodeUserUUID: cnodeUserUUID
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
  const serviceRegistry = req.app.get('serviceRegistry')

  if (config.get('isUserMetadataNode')) {
    return next()
  }

  const start = Date.now()

  if (!req.session || !req.session.wallet) {
    return sendResponse(req, res, errorResponseUnauthorized('User must be logged in'))
  }

  let serviceEndpoint
  try {
    serviceEndpoint = await getOwnEndpoint(serviceRegistry)
  } catch (e) {
    return sendResponse(req, res, errorResponseServerError(e))
  }

  let creatorNodeEndpoints
  try {
    creatorNodeEndpoints = await getCreatorNodeEndpoints({
      serviceRegistry,
      logger: req.logger,
      wallet: req.session.wallet,
      blockNumber: req.body.blockNumber,
      ensurePrimary: true,
      myCnodeEndpoint: serviceEndpoint
    })
  } catch (e) {
    return sendResponse(req, res, errorResponseServerError(e))
  }
  const primary = creatorNodeEndpoints[0]

  // Error if this node is not primary for user.
  if (!primary || (primary && serviceEndpoint !== primary)) {
    return sendResponse(
      req,
      res,
      errorResponseUnauthorized(`This node (${serviceEndpoint}) is not primary for user. Primary is: ${primary}`)
    )
  }
  req.session.nodeIsPrimary = true
  req.session.creatorNodeEndpoints = creatorNodeEndpoints

  req.logger.info(`ensurePrimaryMiddleware succeeded ${Date.now() - start} ms. creatorNodeEndpoints: ${creatorNodeEndpoints}`)
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
 * Tell all secondaries to sync against self.
 * @dev - Is not a middleware so it can be run before responding to client.
 * @dev - TODO move this out of middlewares to Services layer
 */
async function triggerSecondarySyncs (req) {
  const { snapbackSM } = serviceRegistry

  if (config.get('isUserMetadataNode') || config.get('snapbackDevModeEnabled')) {
    return
  }

  try {
    if (!req.session.nodeIsPrimary || !req.session.creatorNodeEndpoints || !Array.isArray(req.session.creatorNodeEndpoints)) {
      return
    }

    const [primary, ...secondaries] = req.session.creatorNodeEndpoints

    // Enqueue a manual sync for all secondaries
    await Promise.all(secondaries.map(async secondary => {
      if (!secondary || !_isFQDN(secondary)) {
        return
      }

      const userWallet = req.session.wallet

      await snapbackSM.enqueueSync({
        userWallet,
        secondaryEndpoint: secondary,
        primaryEndpoint: primary,
        syncType: SyncType.Manual
      })
    }))
  } catch (e) {
    req.logger.error(`Trigger secondary syncs ${req.session.wallet}`, e.message)
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
  if (config.get('isUserMetadataNode')) {
    throw new Error('Not available for userMetadataNode')
  }

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

  if (config.get('isUserMetadataNode')) {
    throw new Error('Not available for userMetadataNode')
  }

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
  triggerSecondarySyncs,
  syncLockMiddleware,
  getOwnEndpoint,
  getCreatorNodeEndpoints
}
