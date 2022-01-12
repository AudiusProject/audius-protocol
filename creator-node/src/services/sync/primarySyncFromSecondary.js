const axios = require('axios')
const retry = require('async-retry')
const _ = require('lodash')

const initBootstrapAndRefreshPeers = require('./initBootstrapAndRefreshPeers.js')
const models = require('../../models')
const { logger: genericLogger } = require('../../logging.js')
const DBManager = require('../../dbManager.js')

const EXPORT_REQ_TIMEOUT_MS = 10000 // 10000ms = 10s
const EXPORT_REQ_MAX_RETRIES = 3
const DEFAULT_LOG_CONTEXT = {}

const PHASES = {}

async function fetchExportFromSecondary({
  secondary,
  wallet,
  clockRangeMin,
  sourceEndpoint,
  logPrefix
}) {
  logPrefix = `${logPrefix} [fetchExportFromSecondary]`

  const exportQueryParams = {
    wallet_public_key: [wallet],  // export requires a wallet array
    clock_range_min: clockRangeMin,
    source_endpoint: sourceEndpoint
  }

  try {
    const exportResp = await retry(
      // Throws on any non-200 response code
      async () => axios({
        method: 'get',
        baseURL: secondary,
        url: '/export',
        responseType: 'json',
        params: exportQueryParams,
        timeout: EXPORT_REQ_TIMEOUT_MS
      }),
      {
        retries: EXPORT_REQ_MAX_RETRIES
      }
    )

    // if (
    //   !_.has(exportResp, 'data.data')
    //   || !_.has(exportResp, 'data.data.cnodeUsers')
    //   || !_.has(exportResp, 'data.data.ipfsIDObj')
    //   || !_.has(exportResp, 'data.data.clockInfo')
    //   || exportResp.data.data.cnodeUsers.length !== 1
    //   || !_.has(exportResp.data.data.cnodeUsers[0], 'walletPublicKey')
    // ) {
    //   throw new Error('Malformatted export response data')
    // }

    // TODO check if returned clockrange matches requested

    return exportResp.data.data 
  } catch (e) {
    throw new Error(`${logPrefix} ERROR: ${e.message}`)
  }
}

async function fillInDataLocally(fetchedCNodeUser) {
  /**
   * fetch all Files, diff all against local DB
   * write data for all diffed files to disk
   * write all DB state in TX
   */

  const walletPublicKey = fetchedCNodeUser.walletPublicKey

  /**
   * TODO all file retrieval & disk ops
   */

  const transaction = await models.sequelize.transaction()

  let localCNodeUser = await models.CNodeUser.findOne({
    where: { walletPublicKey },
    transaction
  })

  if (localCNodeUser) {
    // TODO
    console.log('SIDTEST NO WHAT NO LOCALCNODEUSER')
  } else {
    localCNodeUser = await models.CNodeUser.create(
      _.omit(fetchedCNodeUser, ['cnodeUserUUID']),
      { returning: true, transaction }
    )
    console.log(`SIDTEST CREATED CNODEUSER`)
  }

  const cnodeUserUUID = localCNodeUser.cnodeUserUUID

  const {
    audiusUsers: fetchedAudiusUsers,
    tracks: fetchedTracks,
    files: fetchedFiles
  } = fetchedCNodeUser

  // Aggregate all entries into single array, sorted by clock asc to preserve original insert order
  let allEntries = _.concat(
    [],
    fetchedAudiusUsers.map(audiusUser => ({ tableInstance: models.AudiusUser, entry: audiusUser })),
    fetchedTracks.map(track => ({ tableInstance: models.Track, entry: track })),
    fetchedFiles.map(file => ({ tableInstance: models.File, entry: file }))
  )
  allEntries = _.orderBy(allEntries, ['entry.clock'], ['asc'])

  for await (const { tableInstance, entry } of allEntries) {
    const dataValues = await DBManager.createNewDataRecord(
      entry,
      cnodeUserUUID,
      tableInstance,
      transaction
    )
    console.log(`newly created data value: ${JSON.stringify(dataValues)}`)
  }

  await transaction.commit()
}

/**
 * TODO abstract
 * TODO ensure lock timeout?
 */
async function acquireUserRedisLock({ redis, wallet }) {
  const errorMsgPrefix = `[primarySyncFromSecondary:acquireUserRedisLock] [Wallet: ${wallet}] ERROR:`
  try {
    const redisLock = redis.lock
    const redisKey = redis.getRedisKeyForWallet(wallet)
    const lockHeld = await redisLock.getLock(redisKey)
    if (lockHeld) {
      throw new Error(`Failed to acquire lock - already held.`)
    }
    await redisLock.setLock(redisKey)
  } catch (e) {
    throw new Error(`${errorMsgPrefix} ${e.message}`)
  }
}

/**
 * TODO abstract
 * TODO what if lock not held?
 */
async function releaseUserRedisLock({ redis, wallet }) {
  const redisLock = redis.lock
  const redisKey = redis.getRedisKeyForWallet(wallet)
  await redisLock.removeLock(redisKey)
}

/**
 * Export data for user from secondary and fill in locally, until complete
 */
async function primarySyncFromSecondary({
  serviceRegistry,
  secondary,
  wallet,
  sourceEndpoint,
  logContext = DEFAULT_LOG_CONTEXT
}) {
  const { nodeConfig, redis } = serviceRegistry
  const logger = genericLogger.child(logContext)
  const logPrefix = `[primarySyncFromSecondary] [Wallet: ${wallet}] [Secondary: ${secondary}]`

  const FileSaveMaxConcurrency = nodeConfig.get(
    'nodeSyncFileSaveMaxConcurrency'
  )
  const SyncRequestMaxUserFailureCountBeforeSkip = nodeConfig.get(
    'syncRequestMaxUserFailureCountBeforeSkip'
  )

  const start = Date.now()
  logger.info(`[primarySyncFromSecondary] [Wallet: ${wallet}] Beginning...`)

  try {
    await acquireUserRedisLock({ redis, wallet })

    let completed = false
    const clockRangeMin = 0
    while (!completed) {
      const exportData = await fetchExportFromSecondary({
        secondary,
        wallet,
        clockRangeMin,
        sourceEndpoint,
        logPrefix
      })

      const { cnodeUsers, ipfsIDObj } = exportData

      const fetchedCNodeUser = cnodeUsers[Object.keys(cnodeUsers)[0]]
      if (fetchedCNodeUser.walletPublicKey !== wallet) {
        throw new Error('NO BAD NO')
      }

      // Attempt to connect to opposing IPFS node without waiting
      initBootstrapAndRefreshPeers(serviceRegistry, logger, ipfsIDObj.addresses, logPrefix)

      await fillInDataLocally(fetchedCNodeUser)

      // While-loop termination
      const clockInfo = fetchedCNodeUser.clockInfo
      if (clockInfo.localClockMax <= clockInfo.requestedClockRangeMax) {
        completed = true
      } else {
        clockRangeMin = clockInfo.requestedClockRangeMax + 1
      }
    }

  } catch (e) {
    console.log(`SIDTEST ERROR ${e}`)
    // TODO syncHistoryAggregator??
  } finally {
    await releaseUserRedisLock({ redis, wallet })

    // TODO logging
  }
}

module.exports = primarySyncFromSecondary
