const axios = require('axios')
const retry = require('async-retry')
const _ = require('lodash')

const config = require('../../config')
const redis = require('../../redis')
const models = require('../../models')
const { logger: genericLogger } = require('../../logging')
const DBManager = require('../../dbManager')
const { getCreatorNodeEndpoints } = require('../../middlewares')
const { saveFileForMultihashToFS } = require('../../fileManager')
const SyncHistoryAggregator = require('../../snapbackSM/syncHistoryAggregator')
const { serviceRegistry } = require('../../serviceRegistry')

const EXPORT_REQ_TIMEOUT_MS = 10000 // 10000ms = 10s
const EXPORT_REQ_MAX_RETRIES = 3
const USER_WRITE_LOCK_TIMEOUT_MS = 1800000 // 30min
const DEFAULT_LOG_CONTEXT = {}

/**
 * Export data for user from secondary and save locally, until complete
 * Should never error, instead return errorObj, else null
 */
module.exports = async function primarySyncFromSecondary({
  secondary,
  wallet,
  logContext = DEFAULT_LOG_CONTEXT
}) {
  await serviceRegistry.initLibs()

  // This is used only for logging record endpoint of requesting node
  const selfEndpoint = config.get('creatorNodeEndpoint') || null

  const logPrefix = `[primarySyncFromSecondary][Wallet: ${wallet}][Secondary: ${secondary}]`
  const logger = genericLogger.child(logContext)
  logger.info(`[primarySyncFromSecondary] [Wallet: ${wallet}] Beginning...`)
  const start = Date.now()

  // object to track if the function errored, returned at the end of the function
  let error = null

  try {
    await acquireUserRedisLock({ redis, wallet })

    const userReplicaSet = await getUserReplicaSet({
      wallet,
      selfEndpoint,
      logger,
      logPrefix
    })

    let completed = false
    let exportClockRangeMin = 0
    while (!completed) {
      const fetchedCNodeUser = await fetchExportFromSecondary({
        secondary,
        wallet,
        exportClockRangeMin,
        selfEndpoint
      })

      await saveFilesToDisk({
        files: fetchedCNodeUser.files,
        userReplicaSet,
        logger
      })

      await saveEntriesToDB({
        fetchedCNodeUser,
        logger,
        logPrefix
      })

      // Keep going until data for full clock range has been retrieved
      const clockInfo = fetchedCNodeUser.clockInfo
      if (clockInfo.localClockMax <= clockInfo.requestedClockRangeMax) {
        completed = true
      } else {
        exportClockRangeMin = clockInfo.requestedClockRangeMax + 1
      }
    }
  } catch (e) {
    error = e

    logger.error(`${logPrefix} Sync error ${e.message}`)

    await SyncHistoryAggregator.recordSyncFail(wallet)
  } finally {
    await releaseUserRedisLock({ redis, wallet })

    if (error) {
      logger.error(
        `${logPrefix} Error ${error.message} [Duration: ${
          Date.now() - start
        }ms]`
      )
    } else {
      logger.info(`${logPrefix} Complete [Duration: ${Date.now() - start}ms]`)
    }
  }

  return error
}

async function fetchExportFromSecondary({
  secondary,
  wallet,
  clockRangeMin,
  selfEndpoint
}) {
  const exportQueryParams = {
    wallet_public_key: [wallet], // export requires a wallet array
    clock_range_min: clockRangeMin,
    source_endpoint: selfEndpoint
  }

  try {
    const exportResp = await retry(
      // Throws on any non-200 response code
      async () =>
        axios({
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

    // Validate export response
    if (
      !_.has(exportResp, 'data.data') ||
      !_.has(exportResp.data.data, 'cnodeUsers') ||
      Object.keys(exportResp.data.data.cnodeUsers).length !== 1
    ) {
      throw new Error('Malformatted export response data')
    }

    const { cnodeUsers } = exportResp.data.data

    const fetchedCNodeUser = cnodeUsers[Object.keys(cnodeUsers)[0]]

    if (fetchedCNodeUser.walletPublicKey !== wallet) {
      throw new Error('Wallet mismatch')
    }

    return fetchedCNodeUser
  } catch (e) {
    throw new Error(`[fetchExportFromSecondary] ERROR: ${e.message}`)
  }
}

/**
 * Fetch data for all files & save to disk
 *
 * - These ops are performed before DB ops to minimize DB TX duration
 * - `saveFileForMultihashToFS` will exit early if files already exist on disk
 * - Performed in batches to limit concurrent load
 */
async function saveFilesToDisk({ files, userReplicaSet, logger }) {
  const FileSaveMaxConcurrency = config.get('nodeSyncFileSaveMaxConcurrency')

  const trackFiles = files.filter((file) =>
    models.File.TrackTypes.includes(file.type)
  )
  const nonTrackFiles = files.filter((file) =>
    models.File.NonTrackTypes.includes(file.type)
  )

  /**
   * Save all Track files to disk
   */
  for (let i = 0; i < trackFiles.length; i += FileSaveMaxConcurrency) {
    const trackFilesSlice = trackFiles.slice(i, i + FileSaveMaxConcurrency)

    /**
     * Fetch content for each CID + save to FS
     * Record any CIDs that failed retrieval/saving for later use
     *
     * - `saveFileForMultihashToFS()` should never reject - it will return error indicator for post processing
     */
    await Promise.all(
      trackFilesSlice.map(async (trackFile) => {
        const succeeded = await saveFileForMultihashToFS(
          serviceRegistry,
          logger,
          trackFile.multihash,
          trackFile.storagePath,
          userReplicaSet,
          null, // fileNameForImage
          trackFile.trackBlockchainId
        )
        if (!succeeded) {
          throw new Error(
            `[saveFileForMultihashToFS] Failed for multihash ${trackFile.multihash}`
          )
        }
      })
    )
  }

  /**
   * Save all non-Track files to disk
   */
  for (let i = 0; i < nonTrackFiles.length; i += FileSaveMaxConcurrency) {
    const nonTrackFilesSlice = nonTrackFiles.slice(
      i,
      i + FileSaveMaxConcurrency
    )

    await Promise.all(
      nonTrackFilesSlice.map(async (nonTrackFile) => {
        // Skip over directories since there's no actual content to sync
        // The files inside the directory are synced separately
        if (nonTrackFile.type === 'dir') {
          return
        }

        const multihash = nonTrackFile.multihash

        // if it's an image file, we need to pass in the actual filename because the gateway request is /ipfs/Qm123/<filename>
        // need to also check fileName is not null to make sure it's a dir-style image. non-dir images won't have a 'fileName' db column
        let succeeded
        if (nonTrackFile.type === 'image' && nonTrackFile.fileName !== null) {
          succeeded = await saveFileForMultihashToFS(
            serviceRegistry,
            logger,
            multihash,
            nonTrackFile.storagePath,
            userReplicaSet,
            nonTrackFile.fileName
          )
        } else {
          succeeded = await saveFileForMultihashToFS(
            serviceRegistry,
            logger,
            multihash,
            nonTrackFile.storagePath,
            userReplicaSet
          )
        }

        if (!succeeded) {
          throw new Error(
            `[saveFileForMultihashToFS] Failed for multihash ${multihash}`
          )
        }
      })
    )
  }
}

/**
 * Given fetchedEntries, filters out entries already present in local DB
 *
 *
 * @returns filtered version of fetchedEntries
 */
async function filterOutAlreadyPresentDBEntries({
  cnodeUserUUID,
  tableInstance,
  fetchedEntries,
  transaction,
  comparisonFields
}) {
  let filteredEntries = fetchedEntries

  const limit = 10000
  let offset = 0
  let complete = false
  while (!complete) {
    const localEntries = await tableInstance.findAll({
      where: { cnodeUserUUID },
      limit,
      offset,
      order: [['clock', 'ASC']],
      transaction
    })

    filteredEntries = filteredEntries.filter((fetchedEntry) => {
      let alreadyPresent = false
      localEntries.forEach((localEntry) => {
        const obj1 = _.pick(fetchedEntry, comparisonFields)
        const obj2 = _.pick(localEntry, comparisonFields)
        const isEqual = _.isEqual(obj1, obj2)
        if (isEqual) {
          alreadyPresent = true
        }
      })
      return !alreadyPresent
    })

    offset += limit

    if (localEntries.length < limit) {
      complete = true
    }
  }

  return filteredEntries
}

/**
 * Saves all entries to DB
 * De-dupes entries before insert
 */
async function saveEntriesToDB({ fetchedCNodeUser, logger, logPrefix }) {
  let {
    walletPublicKey,
    audiusUsers: fetchedAudiusUsers,
    tracks: fetchedTracks,
    files: fetchedFiles
  } = fetchedCNodeUser

  const transaction = await models.sequelize.transaction()

  logger.info(
    logPrefix,
    `beginning add ops for cnodeUser wallet ${walletPublicKey}`
  )

  let localCNodeUser = await models.CNodeUser.findOne({
    where: { walletPublicKey },
    transaction
  })

  let cnodeUserUUID
  if (localCNodeUser) {
    /**
     * If local CNodeUser exists, filter out any received entries that are already present in DB
     */

    cnodeUserUUID = localCNodeUser.cnodeUserUUID

    const audiusUserComparisonFields = [
      'blockchainId',
      'metadataFileUUID',
      'metadataJSON',
      'coverArtFileUUID',
      'profilePicFileUUID'
    ]
    fetchedAudiusUsers = await filterOutAlreadyPresentDBEntries({
      cnodeUserUUID,
      tableInstance: models.AudiusUser,
      fetchedEntries: fetchedAudiusUsers,
      transaction,
      comparisonFields: audiusUserComparisonFields
    })

    const trackComparisonFields = [
      'blockchainId',
      'metadataFileUUID',
      'metadataJSON',
      'coverArtFileUUID'
    ]
    fetchedTracks = await filterOutAlreadyPresentDBEntries({
      cnodeUserUUID,
      tableInstance: models.Track,
      fetchedEntries: fetchedTracks,
      transaction,
      comparisonFields: trackComparisonFields
    })

    const fileComparisonFields = ['fileUUID']
    fetchedFiles = await filterOutAlreadyPresentDBEntries({
      cnodeUserUUID,
      tableInstance: models.File,
      fetchedEntries: fetchedFiles,
      transaction,
      comparisonFields: fileComparisonFields
    })
  } else {
    /**
     * Create CNodeUser DB record if not already present
     * Omit `cnodeUserUUID` since it will be auto-generated on DB insert
     */
    localCNodeUser = await models.CNodeUser.create(
      _.omit({ ...fetchedCNodeUser, clock: 0 }, ['cnodeUserUUID']),
      { returning: true, transaction }
    )

    cnodeUserUUID = localCNodeUser.cnodeUserUUID
  }

  // Aggregate all entries into single array, sorted by clock asc to preserve original insert order
  let allEntries = _.concat(
    [],
    fetchedAudiusUsers.map((audiusUser) => ({
      tableInstance: models.AudiusUser,
      entry: audiusUser
    })),
    fetchedTracks.map((track) => ({
      tableInstance: models.Track,
      entry: track
    })),
    fetchedFiles.map((file) => ({ tableInstance: models.File, entry: file }))
  )
  allEntries = _.orderBy(allEntries, ['entry.clock'], ['asc'])

  for await (const { tableInstance, entry } of allEntries) {
    await DBManager.createNewDataRecord(
      _.omit(entry, ['cnodeUserUUID']),
      cnodeUserUUID,
      tableInstance,
      transaction
    )
  }

  await transaction.commit()
}

async function getUserReplicaSet({ wallet, selfEndpoint, logger }) {
  try {
    let userReplicaSet = await getCreatorNodeEndpoints({
      serviceRegistry,
      logger,
      wallet,
      blockNumber: null,
      ensurePrimary: false,
      myCnodeEndpoint: null
    })

    // filter out current node from user's replica set
    userReplicaSet = userReplicaSet.filter((url) => url !== selfEndpoint)

    // Spread + set uniq's the array
    userReplicaSet = [...new Set(userReplicaSet)]

    return userReplicaSet
  } catch (e) {
    throw new Error(`[getUserReplicaSet()] Error - ${e.message}`)
  }
}

async function acquireUserRedisLock({ redis, wallet }) {
  const errorMsgPrefix = `[primarySyncFromSecondary:acquireUserRedisLock] [Wallet: ${wallet}] ERROR:`

  const redisLock = redis.lock
  const redisKey = redis.getRedisKeyForWallet(wallet)

  const acquired = await redisLock.acquireLock(
    redisKey,
    USER_WRITE_LOCK_TIMEOUT_MS
  )
  if (!acquired) {
    throw new Error(`${errorMsgPrefix} Failed to acquire lock - already held.`)
  }
}

async function releaseUserRedisLock({ redis, wallet }) {
  const redisLock = redis.lock
  const redisKey = redis.getRedisKeyForWallet(wallet)

  // Succeeds even if no lock exists for key
  await redisLock.removeLock(redisKey)
}
