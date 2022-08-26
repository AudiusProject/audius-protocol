const axios = require('axios')
const _ = require('lodash')

const config = require('../../config')
const redis = require('../../redis')
const { WalletWriteLock } = redis
const models = require('../../models')
const { logger: genericLogger } = require('../../logging')
const DBManager = require('../../dbManager')
const { getUserReplicaSetEndpointsFromDiscovery } = require('../../middlewares')
const { saveFileForMultihashToFS } = require('../../fileManager')
const SyncHistoryAggregator = require('../../snapbackSM/syncHistoryAggregator')
const initAudiusLibs = require('../initAudiusLibs')
const asyncRetry = require('../../utils/asyncRetry')
const DecisionTree = require('../../utils/decisionTree')
const UserSyncFailureCountService = require('./UserSyncFailureCountService')

const EXPORT_REQ_TIMEOUT_MS = 10000 // 10000ms = 10s
const EXPORT_REQ_MAX_RETRIES = 3
const DEFAULT_LOG_CONTEXT = {}
const DB_QUERY_LIMIT = config.get('devMode') ? 5 : 10000
const SyncRequestMaxUserFailureCountBeforeSkip = config.get(
  'syncRequestMaxUserFailureCountBeforeSkip'
)

/**
 * Export data for user from secondary and save locally, until complete
 * Should never error, instead return errorObj, else null
 */
module.exports = async function primarySyncFromSecondary({
  wallet,
  secondary,
  logContext = DEFAULT_LOG_CONTEXT
}) {
  const logPrefix = `[primarySyncFromSecondary][Wallet: ${wallet}][Secondary: ${secondary}]`
  const logger = genericLogger.child(logContext)

  const decisionTree = new DecisionTree({ name: logPrefix, logger })
  decisionTree.recordStage({ name: 'Begin', log: true })

  try {
    const selfEndpoint = config.get('creatorNodeEndpoint')

    if (!selfEndpoint) {
      decisionTree.recordStage({ name: 'selfEndpoint missing', log: false })
      throw new Error('selfEndpoint missing')
    }

    let libs
    try {
      libs = await initAudiusLibs({ logger })
      decisionTree.recordStage({ name: 'initAudiusLibs() success', log: true })
    } catch (e) {
      decisionTree.recordStage({
        name: 'initAudiusLibs() Error',
        data: { errorMsg: e.message }
      })
      throw new Error(`InitAudiusLibs Error - ${e.message}`)
    }

    await WalletWriteLock.acquire(
      wallet,
      WalletWriteLock.VALID_ACQUIRERS.PrimarySyncFromSecondary
    )

    // TODO should be able to pass this through from StateMachine / caller
    const userReplicaSet = await getUserReplicaSetEndpointsFromDiscovery({
      libs,
      logger,
      wallet,
      blockNumber: null,
      ensurePrimary: false
    })
    decisionTree.recordStage({ name: 'getUserReplicaSet() success', log: true })

    // Error if this node is not primary for user
    if (userReplicaSet.primary !== selfEndpoint) {
      decisionTree.recordStage({
        name: 'Error - Node is not primary for user',
        data: { userReplicaSet }
      })
      throw new Error(`Node is not primary for user`)
    }

    // Use the user's non-empty secondaries as gateways to try
    const gatewaysToTry = [
      userReplicaSet.secondary1,
      userReplicaSet.secondary2
    ].filter(Boolean)

    // Keep importing data from secondary until full clock range has been retrieved
    let completed = false
    let exportClockRangeMin = 0
    while (!completed) {
      decisionTree.recordStage({
        name: 'Begin data import batch',
        data: { exportClockRangeMin },
        log: true
      })

      // Fetch export for CNodeUser from secondary
      let fetchedCNodeUser
      try {
        fetchedCNodeUser = await fetchExportFromSecondary({
          secondary,
          wallet,
          exportClockRangeMin,
          selfEndpoint
        })
        decisionTree.recordStage({
          name: 'fetchExportFromSecondary() Success',
          log: true
        })
      } catch (e) {
        decisionTree.recordStage({
          name: 'fetchExportFromSecondary() Error',
          data: { errorMsg: e.message }
        })
        throw e
      }

      // Save all files to disk separately from DB writes to minimize DB transaction duration
      let CIDsThatFailedSaveFileOp
      try {
        // saveFilesToDisk() will short-circuit if files already exist on disk
        CIDsThatFailedSaveFileOp = await saveFilesToDisk({
          files: fetchedCNodeUser.files,
          gatewaysToTry,
          wallet,
          libs,
          logger,
          logPrefix
        })
        decisionTree.recordStage({
          name: 'saveFilesToDisk() Success',
          data: {
            numSaved:
              fetchedCNodeUser.files.length - CIDsThatFailedSaveFileOp.size,
            numCIDsThatFailedSaveFileOp: CIDsThatFailedSaveFileOp.size,
            CIDsThatFailedSaveFileOp
          },
          log: true
        })
      } catch (e) {
        decisionTree.recordStage({
          name: 'saveFilesToDisk() Error',
          data: { errorMsg: e.message }
        })
        throw e
      }

      // Save all entries from export to DB
      try {
        await saveEntriesToDB({
          fetchedCNodeUser,
          CIDsThatFailedSaveFileOp,
          decisionTree
        })
        decisionTree.recordStage({
          name: 'saveEntriesToDB() Success',
          log: true
        })
      } catch (e) {
        decisionTree.recordStage({
          name: 'saveEntriesToDB() Error',
          data: { errorMsg: e.message }
        })
        throw e
      }

      const clockInfo = fetchedCNodeUser.clockInfo
      if (clockInfo.localClockMax <= clockInfo.requestedClockRangeMax) {
        completed = true
      } else {
        exportClockRangeMin = clockInfo.requestedClockRangeMax + 1
      }
    }

    decisionTree.recordStage({ name: 'Complete Success' })
  } catch (e) {
    await SyncHistoryAggregator.recordSyncFail(wallet)
    return e
  } finally {
    await WalletWriteLock.release(wallet)

    decisionTree.printTree()
  }
}

/**
 * Fetch export for wallet from secondary for max clock range, starting at clockRangeMin
 */
async function fetchExportFromSecondary({
  wallet,
  secondary,
  clockRangeMin,
  selfEndpoint
}) {
  // Makes request with default `maxExportClockValueRange`
  const exportQueryParams = {
    wallet_public_key: [wallet], // export requires a wallet array
    clock_range_min: clockRangeMin,
    source_endpoint: selfEndpoint,
    force_export: true
  }

  const exportResp = await asyncRetry({
    // Throws on any non-200 response code
    asyncFn: () =>
      axios({
        method: 'get',
        baseURL: secondary,
        url: '/export',
        responseType: 'json',
        params: exportQueryParams,
        timeout: EXPORT_REQ_TIMEOUT_MS
      }),
    retries: EXPORT_REQ_MAX_RETRIES,
    log: false
  })

  // Validate export response
  if (
    !_.has(exportResp, 'data.data') ||
    !_.has(exportResp.data.data, 'cnodeUsers')
  ) {
    throw new Error('Malformatted export response data')
  }

  const { cnodeUsers } = exportResp.data.data

  if (!cnodeUsers.length === 0) {
    throw new Error('No cnodeUser returned from export')
  } else if (cnodeUsers.length > 1) {
    throw new Error('Multiple cnodeUsers returned from export')
  }

  const fetchedCNodeUser = cnodeUsers[Object.keys(cnodeUsers)[0]]
  if (fetchedCNodeUser.walletPublicKey !== wallet) {
    throw new Error('Wallet mismatch')
  }

  return fetchedCNodeUser
}

/**
 * Fetch data for all files & save to disk
 *
 * - `saveFileForMultihashToFS` will short-circuit if file already exists on disk
 * - Performed in batches to limit concurrent load
 */
async function saveFilesToDisk({
  files,
  gatewaysToTry,
  wallet,
  libs,
  logger,
  logPrefix
}) {
  const FileSaveMaxConcurrency = config.get('nodeSyncFileSaveMaxConcurrency')

  const trackFiles = files.filter((file) =>
    models.File.TrackTypes.includes(file.type)
  )
  const nonTrackFiles = files.filter((file) =>
    models.File.NonTrackTypes.includes(file.type)
  )

  const CIDsThatFailedSaveFileOp = new Set()

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
        const error = await saveFileForMultihashToFS(
          libs,
          logger,
          trackFile.multihash,
          trackFile.storagePath,
          gatewaysToTry,
          null, // fileNameForImage
          trackFile.trackBlockchainId
        )

        // If saveFile op failed, record CID for later processing
        if (error) {
          CIDsThatFailedSaveFileOp.add(trackFile.multihash)
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
        let error
        if (nonTrackFile.type === 'image' && nonTrackFile.fileName !== null) {
          error = await saveFileForMultihashToFS(
            libs,
            logger,
            multihash,
            nonTrackFile.storagePath,
            gatewaysToTry,
            nonTrackFile.fileName
          )
        } else {
          error = await saveFileForMultihashToFS(
            libs,
            logger,
            multihash,
            nonTrackFile.storagePath,
            gatewaysToTry
          )
        }

        // If saveFile op failed, record CID for later processing
        if (error) {
          CIDsThatFailedSaveFileOp.add(multihash)
        }
      })
    )
  }

  /**
   * Handle case where some CIDs were not successfully saved
   * Reject whole operation until threshold reached, then proceed and mark those CIDs as skipped
   */
  if (CIDsThatFailedSaveFileOp.size > 0) {
    const userSyncFailureCount =
      await UserSyncFailureCountService.incrementFailureCount(wallet)

    // Throw error if failure threshold not yet reached
    if (userSyncFailureCount < SyncRequestMaxUserFailureCountBeforeSkip) {
      throw new Error(
        `[saveFilesToDisk] Failed to save ${CIDsThatFailedSaveFileOp.size} files to disk. Cannot proceed because UserSyncFailureCount = ${userSyncFailureCount} below SyncRequestMaxUserFailureCountBeforeSkip = ${SyncRequestMaxUserFailureCountBeforeSkip}.`
      )
    } else {
      // If threshold reached, reset failure count and continue
      await UserSyncFailureCountService.resetFailureCount(wallet)

      logger.info(
        `${logPrefix} [saveFilesToDisk] Failed to save ${CIDsThatFailedSaveFileOp.size} files to disk. Proceeding anyway because UserSyncFailureCount = ${userSyncFailureCount} reached SyncRequestMaxUserFailureCountBeforeSkip = ${SyncRequestMaxUserFailureCountBeforeSkip}.`
      )
    }
  } else {
    // Reset failure count if all CIDs were successfully saved
    await UserSyncFailureCountService.resetFailureCount(wallet)
  }

  return CIDsThatFailedSaveFileOp
}

/**
 * Saves all entries to DB that don't already exist in DB
 */
async function saveEntriesToDB({
  fetchedCNodeUser,
  CIDsThatFailedSaveFileOp,
  decisionTree
}) {
  const transaction = await models.sequelize.transaction()

  decisionTree.recordStage({
    name: 'Begin saveEntriesToDB()',
    log: true
  })

  try {
    let {
      walletPublicKey,
      audiusUsers: fetchedAudiusUsers,
      tracks: fetchedTracks,
      files: fetchedFiles
    } = fetchedCNodeUser

    let localCNodeUser = await models.CNodeUser.findOne({
      where: { walletPublicKey },
      transaction
    })

    let cnodeUserUUID

    /**
     * If local CNodeUser exists, filter out any received entries that are already present in DB
     */
    if (localCNodeUser) {
      cnodeUserUUID = localCNodeUser.cnodeUserUUID

      decisionTree.recordStage({
        name: 'Begin filterOutAlreadyPresentDBEntries()',
        data: { cnodeUserUUID },
        log: true
      })

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
        comparisonFields: audiusUserComparisonFields,
        decisionTree
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
        comparisonFields: trackComparisonFields,
        decisionTree
      })

      const fileComparisonFields = ['fileUUID']
      fetchedFiles = await filterOutAlreadyPresentDBEntries({
        cnodeUserUUID,
        tableInstance: models.File,
        fetchedEntries: fetchedFiles,
        transaction,
        comparisonFields: fileComparisonFields,
        decisionTree
      })

      decisionTree.recordStage({
        name: 'filterOutAlreadyPresentDBEntries() Success',
        log: true
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

      decisionTree.recordStage({
        name: 'Create local CNodeUser DB Record - Success',
        log: true
      })
    }

    // Aggregate all entries into single array
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
      fetchedFiles.map((file) => {
        if (CIDsThatFailedSaveFileOp.has(file.multihash)) {
          file.skipped = true
        }
        return {
          tableInstance: models.File,
          entry: file
        }
      })
    )

    decisionTree.recordStage({
      name: 'Aggregated all entries',
      log: true
    })

    // Sort by clock asc to preserve original insert order
    allEntries = _.orderBy(allEntries, ['entry.clock'], ['asc'])

    // Write all entries to DB
    for await (const { tableInstance, entry } of allEntries) {
      try {
        await DBManager.createNewDataRecord(
          _.omit(entry, ['cnodeUserUUID']),
          cnodeUserUUID,
          tableInstance,
          transaction
        )
      } catch (e) {
        decisionTree.recordStage({
          name: 'DBManager.createNewDataRecord() Error',
          data: {
            errorMsg: e.message,
            sourceTable: tableInstance.name,
            entry
          },
          log: true
        })
        throw e
      }
    }
    decisionTree.recordStage({
      name: 'Wrote all entries to DB',
      log: true
    })

    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    throw e
  }
}

/**
 * Given fetchedEntries, filters out entries already present in local DB
 *
 * @notice This function could potentially take a long time as it fetches every single row in `tableInstance` for `cnodeUserUUID`
 *    Memory consumption is minimized by batching this call, but it can still take a long time for users with lots of data
 *
 * @param {Object} param
 * @param {string} param.cnodeUserUUID
 * @param {*} param.tableInstance Sequelize model instance to query
 * @param {Object[]} param.fetchedEntries array of entry objects to filter out
 * @param {*} param.transaction Sequelize transaction
 * @param {string[]} comparisonFields fields to use for equality comparison
 * @returns {Object[]} filteredEntries filtered version of fetchedEntries
 */
async function filterOutAlreadyPresentDBEntries({
  cnodeUserUUID,
  tableInstance,
  fetchedEntries,
  transaction,
  comparisonFields,
  decisionTree
}) {
  let filteredEntries = fetchedEntries

  const limit = DB_QUERY_LIMIT
  let offset = 0

  let complete = false
  while (!complete) {
    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Begin',
      data: { offset, numFetchedEntries: filteredEntries.length },
      log: true
    })

    const localEntries = await tableInstance.findAll({
      where: { cnodeUserUUID },
      limit,
      offset,
      order: [['clock', 'ASC']],
      transaction
    })
    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Retrieved local entries',
      data: { numLocalEntries: localEntries.length },
      log: true
    })

    // filter out everything in `localEntries` from `filteredEntries
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
    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Filtered entries',
      log: true
    })

    offset += limit

    if (localEntries.length < limit) {
      complete = true
    }
  }

  decisionTree.recordStage({
    name: 'filterOutAlreadyPresentDBEntries() Complete',
    data: { numFilteredEntries: filteredEntries.length }
  })

  return filteredEntries
}
