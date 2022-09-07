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
const DecisionTree = require('../../utils/decisionTree')
const { instrumentTracing, tracing } = require('../../tracer')
const { fetchExportFromNode } = require('./syncUtil')
const {
  FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_CONSTS
} = require('../stateMachineManager/stateMachineConstants')

const DEFAULT_LOG_CONTEXT = {}
const DB_QUERY_LIMIT = config.get('devMode') ? 5 : 10000
const {
  LOCAL_DB_ENTRIES_SET_KEY_PREFIX,
  FETCHED_ENTRIES_SET_KEY_PREFIX,
  UNIQUE_FETCHED_ENTRIES_SET_KEY_PREFIX
} = FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_CONSTS

/**
 * Export data for user from secondary and save locally, until complete
 * Should never error, instead return errorObj, else null
 */
async function _primarySyncFromSecondary({
  wallet,
  secondary,
  logContext = DEFAULT_LOG_CONTEXT
}) {
  const logger = genericLogger.child({
    ...logContext,
    wallet,
    sync: 'primarySyncFromSecondary',
    secondary
  })

  const decisionTree = new DecisionTree({
    name: `[primarySyncFromSecondary][Wallet: ${wallet}][Secondary: ${secondary}]`,
    logger
  })
  decisionTree.recordStage({ name: 'Begin', log: true })

  try {
    const selfEndpoint = config.get('creatorNodeEndpoint')

    if (!selfEndpoint) {
      decisionTree.recordStage({ name: 'selfEndpoint missing', log: false })
      throw new Error('selfEndpoint missing')
    }

    let libs
    try {
      tracing.info('init AudiusLibs')
      libs = await initAudiusLibs({ logger })
      decisionTree.recordStage({ name: 'initAudiusLibs() success', log: true })
    } catch (e) {
      tracing.recordException(e)
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

      const { fetchedCNodeUser, error } = await fetchExportFromNode({
        nodeEndpointToFetchFrom: secondary,
        wallet,
        clockRangeMin: exportClockRangeMin,
        selfEndpoint,
        logger,
        forceExport: true
      })
      if (!_.isEmpty(error)) {
        decisionTree.recordStage({
          name: 'fetchExportFromSecondary() Error',
          data: { errorMsg: error.message }
        })
        throw new Error(error.message)
      }

      const { localClockMax: fetchedLocalClockMax, requestedClockRangeMax } =
        fetchedCNodeUser.clockInfo
      const fetchedCNodeUserClockVal = fetchedCNodeUser.clock

      decisionTree.recordStage({
        name: 'fetchExportFromSecondary() Success',
        data: {
          fetchedLocalClockMax,
          requestedClockRangeMin: exportClockRangeMin,
          requestedClockRangeMax,
          fetchedCNodeUserClockVal
        },
        log: true
      })

      // Save all files to disk separately from DB writes to minimize DB transaction duration
      let CIDsThatFailedSaveFileOp
      try {
        // saveFilesToDisk() will short-circuit if files already exist on disk
        CIDsThatFailedSaveFileOp = await saveFilesToDisk({
          files: fetchedCNodeUser.files,
          gatewaysToTry,
          wallet,
          libs,
          logger
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
        tracing.recordException(e)
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
          decisionTree,
          logger
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

      /**
       * TODO update this once all nodes are running 0.3.66
       *
       * cnodeUser.clock field is used for comparison since it is max(requestedClockRangeMax, actual clockMax)
       * This means:
       *    cnodeUser.clock < requestedClockRangeMax
       *      - no more data to fetch
       *      - completed = true
       *    cnodeUser.clock = requestedClockRangeMax
       *      - may or may not be more data to fetch
       *      - completed = false
       *    cnodeUser.clock > requestedClockRangeMax
       *      - this never happens
       */
      if (fetchedCNodeUserClockVal < requestedClockRangeMax) {
        completed = true
      } else {
        decisionTree.recordStage({
          name: 'About to process next page of multi-page export',
          data: {
            fetchedLocalClockMax,
            requestedClockRangeMin: exportClockRangeMin,
            requestedClockRangeMax,
            fetchedCNodeUserClockVal
          },
          log: true
        })
        exportClockRangeMin = requestedClockRangeMax + 1
      }
    }

    decisionTree.recordStage({ name: 'Complete Success' })
  } catch (e) {
    tracing.recordException(e)
    await SyncHistoryAggregator.recordSyncFail(wallet)
    return e
  } finally {
    await WalletWriteLock.release(wallet)

    decisionTree.printTree()
  }
}

const primarySyncFromSecondary = instrumentTracing({
  fn: _primarySyncFromSecondary,
  options: {
    attributes: {
      [tracing.CODE_FILEPATH]: __filename
    }
  }
})

/**
 * Fetch data for all files & save to disk
 *
 * - `saveFileForMultihashToFS` will short-circuit if file already exists on disk
 * - Performed in batches to limit concurrent load
 */
async function saveFilesToDisk({ files, gatewaysToTry, wallet, libs, logger }) {
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

  return CIDsThatFailedSaveFileOp
}

/**
 * Saves all entries to DB that don't already exist in DB
 */
async function saveEntriesToDB({
  fetchedCNodeUser,
  CIDsThatFailedSaveFileOp,
  decisionTree,
  logger
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
        decisionTree,
        logger
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
        decisionTree,
        logger
      })

      const fileComparisonFields = ['fileUUID']
      fetchedFiles = await filterOutAlreadyPresentDBEntries({
        cnodeUserUUID,
        tableInstance: models.File,
        fetchedEntries: fetchedFiles,
        transaction,
        comparisonFields: fileComparisonFields,
        decisionTree,
        logger
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
 * @param {DecisionTree} decisionTree
 * @returns {Object[]} filteredEntries filtered version of fetchedEntries
 */
async function filterOutAlreadyPresentDBEntries({
  cnodeUserUUID,
  tableInstance,
  fetchedEntries,
  transaction,
  comparisonFields,
  decisionTree,
  logger
}) {
  if (!fetchedEntries || !fetchedEntries.length) {
    return fetchedEntries
  }

  decisionTree.recordStage({
    name: 'filterOutAlreadyPresentDBEntries() Begin',
    data: {
      tableName: tableInstance.name,
      numFetchedEntries: fetchedEntries.length
    },
    log: true
  })

  /**
   * Uses redis to perform set operations to identify which entries received from export do not already exist in local DB
   *
   * fetchedEntries = entries received from export
   * localEntries = entries in local DB
   * set(fetchedUniqueEntries) = set(fetchedEntries) - set(localEntries)
   *
   * For below logic, a redis Set is used for each of 3 above data sets
   */

  // Generate unique redis keys with timestamp to prevent race conditions where same user is processed twice
  const timestamp = Date.now()
  const LOCAL_DB_ENTRIES_SET_KEY = `${LOCAL_DB_ENTRIES_SET_KEY_PREFIX}:::${cnodeUserUUID}:::${timestamp}`
  const FETCHED_ENTRIES_SET_KEY = `${FETCHED_ENTRIES_SET_KEY_PREFIX}:::${cnodeUserUUID}:::${timestamp}`
  const UNIQUE_FETCHED_ENTRIES_SET_KEY = `${UNIQUE_FETCHED_ENTRIES_SET_KEY_PREFIX}:::${cnodeUserUUID}:::${timestamp}`

  try {
    // Deletes all data stored at provided redis keys
    await redis.del(
      LOCAL_DB_ENTRIES_SET_KEY,
      FETCHED_ENTRIES_SET_KEY,
      UNIQUE_FETCHED_ENTRIES_SET_KEY
    )
    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Ensure clean starting redis state',
      log: true
    })

    /**
     * Store all fetched entries into redis Set
     *
     * fetchedEntries is modified to only include comparison fields so Set operations work in redis
     * Each entry object is serialized to string for redis compatibility
     */
    const fetchedEntriesComparable = fetchedEntries.map((entry) =>
      JSON.stringify(_.pick(entry, comparisonFields))
    )
    const numFetchedEntriesAdded = await redis.sadd(
      FETCHED_ENTRIES_SET_KEY,
      fetchedEntriesComparable
    )
    // Fail-safe in case for some reason not all entries were written to redis
    if (numFetchedEntriesAdded !== fetchedEntries.length) {
      throw new Error(
        `Failed to add all entries to redis set for ${FETCHED_ENTRIES_SET_KEY}`
      )
    }
    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Set FETCHED_ENTRIES_SET_KEY',
      log: true
    })

    /** Store all local DB entries into redis set */

    const limit = DB_QUERY_LIMIT
    let lastSeenClock = null
    let complete = false
    let numLocalEntriesAdded = 0
    while (!complete) {
      const whereCondition = { cnodeUserUUID }
      if (lastSeenClock !== null) {
        whereCondition.clock = {
          [models.Sequelize.Op.gt]: lastSeenClock
        }
      }
      const localEntries = await tableInstance.findAll({
        where: whereCondition,
        limit,
        order: [['clock', 'ASC']],
        transaction
      })
      decisionTree.recordStage({
        name: 'filterOutAlreadyPresentDBEntries() Retrieved local entries',
        data: { numLocalEntries: localEntries.length, limit, lastSeenClock },
        log: true
      })

      // Terminate while loop when no entries returned
      if (localEntries.length === 0) {
        complete = true
        continue
      }

      /**
       * Store all local entries into redis Set
       *
       * localEntries is modified to only include comparison fields so Set operations work in redis
       * Each entry object is serialized to string for redis compatibility
       */
      const localEntriesComparable = localEntries.map((entry) =>
        JSON.stringify(_.pick(entry, comparisonFields))
      )
      const numLocalEntriesAddedBatch = await redis.sadd(
        LOCAL_DB_ENTRIES_SET_KEY,
        localEntriesComparable
      )
      // Fail-safe in case for some reason not all entries were written to redis
      if (numLocalEntriesAddedBatch !== localEntries.length) {
        throw new Error(
          `Failed to add all entries to redis set for ${LOCAL_DB_ENTRIES_SET_KEY}`
        )
      }
      numLocalEntriesAdded += numLocalEntriesAddedBatch

      // Move pagination cursor
      lastSeenClock = localEntries[localEntries.length - 1].clock
    }

    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Set LOCAL_DB_ENTRIES_SET_KEY',
      data: { numLocalEntriesAdded },
      log: true
    })

    // set(uniqueFetchedEntries) = set(fetchedEntries) - set(localDBEntries)
    const numUniqueFetchedEntriesComparable = await redis.sdiffstore(
      UNIQUE_FETCHED_ENTRIES_SET_KEY, // destination set
      FETCHED_ENTRIES_SET_KEY, // set A
      LOCAL_DB_ENTRIES_SET_KEY // set B
    )
    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Computed unique fetched entries in redis',
      data: { numUniqueFetchedEntries: numUniqueFetchedEntriesComparable },
      log: true
    })

    /**
     * Filter fetchedEntries to the uniqueFetchedEntries set
     *
     * Since redis Set uniqueFetchedEntries only contains comparison fields subset, set intersection is performed with a custom comparator
     */
    const uniqueFetchedEntriesComparable = await redis.smembers(
      UNIQUE_FETCHED_ENTRIES_SET_KEY
    )
    const uniqueFetchedEntries = _.intersectionWith(
      fetchedEntries,
      uniqueFetchedEntriesComparable,
      // Custom comparator function for 2 params
      (fetchedEntry, uniqueEntryComparable) => {
        const fetchedEntryComparable = JSON.stringify(
          _.pick(fetchedEntry, comparisonFields)
        )
        return _.isEqual(fetchedEntryComparable, uniqueEntryComparable)
      }
    )

    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Great Success',
      data: { numUniqueFetchedEntries: uniqueFetchedEntries.length },
      log: true
    })

    return uniqueFetchedEntries
  } catch (e) {
    decisionTree.recordStage({
      name: 'filterOutAlreadyPresentDBEntries() Error',
      data: { errorMsg: e.message },
      log: true
    })

    throw e
  } finally {
    // Wipe redis state
    try {
      await redis.del(
        LOCAL_DB_ENTRIES_SET_KEY,
        FETCHED_ENTRIES_SET_KEY,
        UNIQUE_FETCHED_ENTRIES_SET_KEY
      )
    } catch (e) {
      logger.error(
        { cnodeUserUUID, errorMsg: e.message },
        '[filterOutAlreadyPresentDBEntries] - Failure to wipe redis state'
      )
    }
  }
}

module.exports = primarySyncFromSecondary
