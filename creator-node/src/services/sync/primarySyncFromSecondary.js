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
const DEFAULT_LOG_CONTEXT = {}

/**
 * Export data for user from secondary and save locally, until complete
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
  const errorObj = null

  try {
    await acquireUserRedisLock({ redis, wallet })

    /**
     * Fetch user replica set for use in `saveExportedData()`
     */
    const userReplicaSet = await getUserReplicaSet({
      wallet,
      selfEndpoint,
      logger,
      logPrefix
    })

    let completed = false
    let exportClockRangeMin = 0
    while (!completed) {
      const { fetchedCNodeUser } = await fetchExportFromSecondary({
        secondary,
        wallet,
        exportClockRangeMin,
        selfEndpoint,
        logger,
        logPrefix
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

      // While-loop termination
      const clockInfo = fetchedCNodeUser.clockInfo
      if (clockInfo.localClockMax <= clockInfo.requestedClockRangeMax) {
        completed = true
      } else {
        exportClockRangeMin = clockInfo.requestedClockRangeMax + 1
      }
    }
  } catch (e) {
    logger.error(`${logPrefix} Sync error ${e.message}`)

    await SyncHistoryAggregator.recordSyncFail(wallet)
  } finally {
    await releaseUserRedisLock({ redis, wallet })

    if (errorObj) {
      logger.error(
        `${logPrefix} Error ${errorObj.message} [Duration: ${
          Date.now() - start
        }ms]`
      )
    } else {
      logger.info(`${logPrefix} Complete [Duration: ${Date.now() - start}ms]`)
    }

    // TODO logging
    console.log(`SIDTEST DONE WITH PRIMARYSYNCFROMSECONDARY`)
  }

  return errorObj
}

async function fetchExportFromSecondary({
  secondary,
  wallet,
  clockRangeMin,
  selfEndpoint,
  logPrefix,
  logger
}) {
  logPrefix = `${logPrefix} [fetchExportFromSecondary]`

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

    // TODO do we need all of this, or is there a cleaner way to compare schema
    if (
      !_.has(exportResp, 'data.data') ||
      !_.has(exportResp.data.data, 'cnodeUsers') ||
      !_.has(exportResp.data.data, 'ipfsIDObj') ||
      Object.keys(exportResp.data.data.cnodeUsers).length !== 1
    ) {
      throw new Error('Malformatted export response data')
    }

    const { cnodeUsers, ipfsIDObj } = exportResp.data.data

    const fetchedCNodeUser = cnodeUsers[Object.keys(cnodeUsers)[0]]
    if (fetchedCNodeUser.walletPublicKey !== wallet) {
      throw new Error('NO BAD NO')
    }

    return { fetchedCNodeUser, ipfsIDObj }
  } catch (e) {
    throw new Error(`${logPrefix} ERROR: ${e.message}`)
  }
}

/**
 * Fetch data for all files & save to disk
 *
 * - These ops are performed before DB ops to minimize DB TX lifespan
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
        const status = await saveFileForMultihashToFS(
          serviceRegistry,
          logger,
          trackFile.multihash,
          trackFile.storagePath,
          userReplicaSet,
          null, // fileNameForImage
          trackFile.trackBlockchainId
        )
        console.log(
          `SIDTEST SFFM MULTIHASH ${trackFile.multihash} STATUS ${status}`
        )
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
        if (nonTrackFile.type !== 'dir') {
          const multihash = nonTrackFile.multihash

          let success

          // if it's an image file, we need to pass in the actual filename because the gateway request is /ipfs/Qm123/<filename>
          // need to also check fileName is not null to make sure it's a dir-style image. non-dir images won't have a 'fileName' db column
          if (nonTrackFile.type === 'image' && nonTrackFile.fileName !== null) {
            success = await saveFileForMultihashToFS(
              serviceRegistry,
              logger,
              multihash,
              nonTrackFile.storagePath,
              userReplicaSet,
              nonTrackFile.fileName
            )
          } else {
            success = await saveFileForMultihashToFS(
              serviceRegistry,
              logger,
              multihash,
              nonTrackFile.storagePath,
              userReplicaSet
            )
          }

          // If saveFile op failed, record CID for later processing
          // if (!success) {
          //   CIDsThatFailedSaveFileOp.add(multihash)
          // }
          console.log(`SIDTEST SFFM MULTIHASH ${multihash} STATUS ${success}`)
        }
      })
    )
  }

  console.log(`SIDTEST SFFM ALL DONE, starting DB`)
}

async function filterOutAlreadyPresentDBEntries({
  cnodeUserUUID,
  tableInstance,
  fetchedEntries,
  transaction,
  comparisonFields
}) {
  const localEntries = await tableInstance.findAll({
    where: { cnodeUserUUID },
    transaction
  })

  console.log(`FETCHEDENTRIES: ${JSON.stringify(fetchedEntries)}`)
  console.log(`localEntries: ${JSON.stringify(localEntries)}`)

  const filteredEntries = fetchedEntries.filter((fetchedEntry) => {
    let alreadyPresent = false
    localEntries.forEach((localEntry) => {
      const obj1 = _.pick(fetchedEntry, comparisonFields)
      const obj2 = _.pick(localEntry, comparisonFields)
      const isEqual = _.isEqual(obj1, obj2)
      console.log(
        `SIDTEST COMPARE: ${JSON.stringify(obj1)} - ${JSON.stringify(
          obj2
        )} - isequal: ${isEqual}`
      )
      if (isEqual) {
        alreadyPresent = true
      }
    })
    return !alreadyPresent
  })

  console.log(
    `FILTEROUTALREADYPRESENT FOUND ${
      fetchedEntries.length - filteredEntries.length
    } DUPES`
  )
  return filteredEntries
}

/**
 * TODO doc
 *
 * fetch all Files, diff all against local DB
 * write data for all diffed files to disk
 * write all DB state in TX
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
    console.log('SIDTEST LOCALCNODEUSER already present')

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
    console.log(`SIDTEST CREATED CNODEUSER`)

    cnodeUserUUID = localCNodeUser.cnodeUserUUID
  }
  console.log(`SIDTEST LOCALCNODEUSER: ${JSON.stringify(localCNodeUser)}`)

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

  console.log(
    `SIDTEST SAVEEXPORTEDDATA num entries to insert: ${allEntries.length}`
  )
  for await (const { tableInstance, entry } of allEntries) {
    const dataValues = await DBManager.createNewDataRecord(
      _.omit(entry, ['cnodeUserUUID']),
      cnodeUserUUID,
      tableInstance,
      transaction
    )
    console.log(`newly created data value: ${JSON.stringify(dataValues)}`)
  }

  await transaction.commit()
  console.log(`SIDTEST DONE WITH saveexportedata`)
}

async function getUserReplicaSet({ wallet, selfEndpoint, logger, logPrefix }) {
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
    // TODO ERROR
    // logger.error(
    //   logPrefix,
    //   `Couldn't get user's replica set, can't use cnode gateways in saveFileForMultihashToFS - ${e.message}`
    // )
  }
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
