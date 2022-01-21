const axios = require('axios')
const retry = require('async-retry')
const _ = require('lodash')

const models = require('../../models')
const { logger: genericLogger } = require('../../logging.js')
const DBManager = require('../../dbManager.js')
const { getCreatorNodeEndpoints } = require('../../middlewares.js')
const initBootstrapAndRefreshPeers = require('./initBootstrapAndRefreshPeers.js')
const { saveFileForMultihashToFS } = require('../../fileManager.js')
const { FileWatcherEventKind } = require('typescript')

const EXPORT_REQ_TIMEOUT_MS = 10000 // 10000ms = 10s
const EXPORT_REQ_MAX_RETRIES = 3
const DEFAULT_LOG_CONTEXT = {}

async function fetchExportFromSecondary({
  secondary,
  wallet,
  clockRangeMin,
  selfEndpoint,
  logPrefix
}) {
  logPrefix = `${logPrefix} [fetchExportFromSecondary]`

  const exportQueryParams = {
    wallet_public_key: [wallet],  // export requires a wallet array
    clock_range_min: clockRangeMin,
    source_endpoint: selfEndpoint
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

/**
 * Fetch data for all files & save to disk
 *
 * - These ops are performed before DB ops to minimize DB TX lifespan
 * - `saveFileForMultihashToFS` will exit early if files already exist on disk
 * - Performed in batches to limit concurrent load
 */
async function saveFilesToDisk ({ files, userReplicaSet, serviceRegistry, logger }) {
  const FileSaveMaxConcurrency = serviceRegistry.nodeConfig.get('nodeSyncFileSaveMaxConcurrency')

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
        console.log(`SIDTEST SFFM MULTIHASH ${trackFile.multihash} STATUS ${status}`)
      })
    )
  }

  /**
   * Save all non-Track files to disk
   */
   for (let i = 0; i < nonTrackFiles.length; i += FileSaveMaxConcurrency) {
    const nonTrackFilesSlice = nonTrackFiles.slice(i, i + FileSaveMaxConcurrency)

    await Promise.all(
      nonTrackFilesSlice.map(async (nonTrackFile) => {
        // Skip over directories since there's no actual content to sync
        // The files inside the directory are synced separately
        if (nonTrackFile.type !== 'dir') {
          const multihash = nonTrackFile.multihash

          let success

          // if it's an image file, we need to pass in the actual filename because the gateway request is /ipfs/Qm123/<filename>
          // need to also check fileName is not null to make sure it's a dir-style image. non-dir images won't have a 'fileName' db column
          if (
            nonTrackFile.type === 'image' &&
            nonTrackFile.fileName !== null
          ) {
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

async function filterOutAlreadyPresentDBEntries ({
  cnodeUserUUID, tableInstance, fetchedEntries, transaction, comparisonFields
}) {
  const localEntries = await tableInstance.findAll({
    where: { cnodeUserUUID },
    transaction
  })

  console.log(`FETCHEDENTRIES: ${JSON.stringify(fetchedEntries)}`)
  console.log(`localEntries: ${JSON.stringify(localEntries)}`)

  const filteredEntries = fetchedEntries.filter(fetchedEntry => {
    let alreadyPresent = false
    localEntries.forEach(localEntry => {
      let obj1 = _.pick(fetchedEntry, comparisonFields)
      let obj2 = _.pick(localEntry, comparisonFields)
      let isEqual = _.isEqual(obj1,obj2)
      console.log(`SIDTEST COMPARE: ${JSON.stringify(obj1)} - ${JSON.stringify(obj2)} - isequal: ${isEqual}`)
      if (isEqual) {
        alreadyPresent = true
      }
    })
    return !alreadyPresent
  })

  console.log(`FILTEROUTALREADYPRESENT FOUND ${fetchedEntries.length - filteredEntries.length} DUPES`)
  return filteredEntries
}

/**
 * TODO doc
 *
 * fetch all Files, diff all against local DB
 * write data for all diffed files to disk
 * write all DB state in TX
 */
async function saveExportedData({ fetchedCNodeUser, userReplicaSet, serviceRegistry, logger }) {
  let {
    walletPublicKey,
    audiusUsers: fetchedAudiusUsers,
    tracks: fetchedTracks,
    files: fetchedFiles
  } = fetchedCNodeUser

  await saveFilesToDisk({ files: fetchedFiles, userReplicaSet, serviceRegistry, logger })  

  /**
   * Write all records to DB
   */

  const transaction = await models.sequelize.transaction()

  let localCNodeUser = await models.CNodeUser.findOne({
    where: { walletPublicKey },
    transaction
  })

  let cnodeUserUUID
  if (localCNodeUser) {
    console.log('SIDTEST LOCALCNODEUSER already present')

    cnodeUserUUID = localCNodeUser.cnodeUserUUID

    const audiusUserComparisonFields = ['blockchainId', 'metadataFileUUID', 'metadataJSON', 'coverArtFileUUID', 'profilePicFileUUID']
    fetchedAudiusUsers = await filterOutAlreadyPresentDBEntries({ 
      cnodeUserUUID,
      tableInstance: models.AudiusUser,
      fetchedEntries: fetchedAudiusUsers,
      transaction,
      comparisonFields: audiusUserComparisonFields
    })

    const trackComparisonFields = ['blockchainId', 'metadataFileUUID', 'metadataJSON', 'coverArtFileUUID']
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
    fetchedAudiusUsers.map(audiusUser => ({ tableInstance: models.AudiusUser, entry: audiusUser })),
    fetchedTracks.map(track => ({ tableInstance: models.Track, entry: track })),
    fetchedFiles.map(file => ({ tableInstance: models.File, entry: file }))
  )
  allEntries = _.orderBy(allEntries, ['entry.clock'], ['asc'])

  console.log(`SIDTEST SAVEEXPORTEDDATA num entries to insert: ${allEntries.length}`)
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

async function getUserReplicaSet({ serviceRegistry, logger, wallet, selfEndpoint }) {
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
    //   redisKey,
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

/**
 * Export data for user from secondary and save locally, until complete
 */
async function primarySyncFromSecondary({
  serviceRegistry,
  secondary,
  wallet,
  selfEndpoint,
  logContext = DEFAULT_LOG_CONTEXT
}) {
  const { redis } = serviceRegistry

  const logger = genericLogger.child(logContext)
  const logPrefix = `[primarySyncFromSecondary] [Wallet: ${wallet}] [Secondary: ${secondary}]`

  logger.info(`[primarySyncFromSecondary] [Wallet: ${wallet}] Beginning...`)

  try {
    await acquireUserRedisLock({ redis, wallet })

    const userReplicaSet = await getUserReplicaSet({ serviceRegistry, logger, wallet, selfEndpoint: selfEndpoint })

    let completed = false
    const clockRangeMin = 0
    while (!completed) {
      const exportData = await fetchExportFromSecondary({
        secondary,
        wallet,
        clockRangeMin,
        selfEndpoint,
        logPrefix
      })

      const { cnodeUsers, ipfsIDObj } = exportData

      const fetchedCNodeUser = cnodeUsers[Object.keys(cnodeUsers)[0]]
      if (fetchedCNodeUser.walletPublicKey !== wallet) {
        throw new Error('NO BAD NO')
      }

      // Attempt to connect to opposing IPFS node without waiting
      initBootstrapAndRefreshPeers(serviceRegistry, logger, ipfsIDObj.addresses, logPrefix)

      await saveExportedData({ fetchedCNodeUser, serviceRegistry, userReplicaSet, logger })

      // While-loop termination
      const clockInfo = fetchedCNodeUser.clockInfo
      if (clockInfo.localClockMax <= clockInfo.requestedClockRangeMax) {
        completed = true
      } else {
        clockRangeMin = clockInfo.requestedClockRangeMax + 1
      }
    }

  } catch (e) {
    console.log(`SIDTEST ERROR ${e}, ${e.stack}`)
    // TODO syncHistoryAggregator??
  } finally {
    await releaseUserRedisLock({ redis, wallet })

    // TODO logging
    console.log(`SIDTEST DONE WITH PRIMARYSYNCFROMSECONDARY`)
  }
}

module.exports = primarySyncFromSecondary
