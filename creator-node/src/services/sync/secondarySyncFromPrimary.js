import _ from 'lodash'

import { logger as genericLogger, createChildLogger } from '../../logging'
import config from '../../config'
import { saveFileForMultihashToFS } from '../../fileManager'
import {
  getOwnEndpoint,
  getUserReplicaSetEndpointsFromDiscovery
} from '../../middlewares'
import SyncHistoryAggregator from '../../snapbackSM/syncHistoryAggregator'
import DBManager from '../../dbManager'
import UserSyncFailureCountService from './UserSyncFailureCountService'
import { shouldForceResync } from './secondarySyncFromPrimaryUtils'
import { instrumentTracing, tracing } from '../../tracer'
import { fetchExportFromNode } from './syncUtil'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const models = require('../../models')

const handleSyncFromPrimary = async ({
  serviceRegistry,
  wallet,
  creatorNodeEndpoint,
  forceResyncConfig,
  forceWipe,
  logContext,
  blockNumber = null
}) => {
  const { nodeConfig, redis, libs } = serviceRegistry
  const FileSaveMaxConcurrency = nodeConfig.get(
    'nodeSyncFileSaveMaxConcurrency'
  )
  const SyncRequestMaxUserFailureCountBeforeSkip = nodeConfig.get(
    'syncRequestMaxUserFailureCountBeforeSkip'
  )
  const thisContentNodeEndpoint = nodeConfig.get('creatorNodeEndpoint')

  const start = Date.now()

  const logger = createChildLogger(genericLogger, {
    wallet,
    sync: 'secondarySyncFromPrimary',
    primary: creatorNodeEndpoint
  })
  logger.info('begin nodesync', 'time', start)

  let returnValue = {}
  try {
    try {
      await redis.WalletWriteLock.acquire(
        wallet,
        redis.WalletWriteLock.VALID_ACQUIRERS.SecondarySyncFromPrimary
      )
    } catch (e) {
      tracing.recordException(e)
      return {
        error: new Error(
          `Cannot change state of wallet ${wallet}. Node sync currently in progress.`
        ),
        result: 'failure_sync_in_progress'
      }
    }

    // Ensure this node is syncing from the user's primary
    const userReplicaSet = await getUserReplicaSetEndpointsFromDiscovery({
      libs,
      logger,
      wallet,
      blockNumber: null,
      ensurePrimary: false
    })
    if (userReplicaSet.primary !== creatorNodeEndpoint) {
      throw new Error(
        `Node being synced from is not primary. Node being synced from: ${creatorNodeEndpoint} Primary: ${userReplicaSet.primary}`
      )
    }

    /**
     * Perform all sync operations, catch and log error if thrown, and always release redis locks after.
     */
    const forceResync = await shouldForceResync(
      { libs, logContext },
      forceResyncConfig
    )
    const forceResyncQueryParam = forceResyncConfig?.forceResync
    if (forceResyncQueryParam && !forceResync) {
      return {
        error: new Error(
          `Cannot issue sync for wallet ${wallet} due to shouldForceResync() rejection`
        ),
        result: 'failure_force_resync_check'
      }
    }

    let localMaxClockVal
    if (forceResync || forceWipe) {
      logger.warn(`Forcing ${forceResync ? 'resync' : 'wipe'}..`)

      // Ensure we never wipe the data of a primary
      if (thisContentNodeEndpoint === userReplicaSet.primary) {
        throw new Error(
          `Tried to wipe data of a primary. User replica set: ${JSON.stringify(
            userReplicaSet
          )}`
        )
      }

      // Short circuit if wiping is disabled via env var
      if (!config.get('syncForceWipeEnabled')) {
        logger.warn('Stopping sync early because syncForceWipeEnabled=false')
        return {
          result: 'success'
        }
      }

      /**
       * Wipe local DB state
       *
       * deleteAllCNodeUserDataFromDB() is not ideal since it can either return an error or throw an error; both scenarios are handled
       */
      let deleteError
      try {
        deleteError = await DBManager.deleteAllCNodeUserDataFromDB({
          lookupWallet: wallet
        })
        localMaxClockVal = -1
      } catch (e) {
        deleteError = e
      }

      if (deleteError) {
        returnValue = {
          error: deleteError,
          result: 'failure_delete_db_data'
        }
        throw returnValue.error
      }

      if (forceWipe) {
        return {
          result: 'success'
        }
      }
    } else {
      // Query own latest clockValue and call export with that value + 1; export from 0 for first time sync
      const cnodeUser = await models.CNodeUser.findOne({
        where: { walletPublicKey: wallet }
      })
      localMaxClockVal = cnodeUser ? cnodeUser.clock : -1
    }

    // Ensure this node is one of the user's secondaries (except when wiping a node with orphaned data).
    // We know we're not wiping an orphaned node at this point because it would've returned earlier if forceWipe=true
    if (
      thisContentNodeEndpoint !== userReplicaSet.secondary1 &&
      thisContentNodeEndpoint !== userReplicaSet.secondary2
    ) {
      throw new Error(
        `This node is not one of the user's secondaries. This node: ${thisContentNodeEndpoint} Secondaries: [${userReplicaSet.secondary1},${userReplicaSet.secondary2}]`
      )
    }

    /**
     * Fetch data export from creatorNodeEndpoint for given walletPublicKeys and clock value range
     *
     * Secondary requests export of new data by passing its current max clock value in the request.
     * Primary builds an export object of all data beginning from the next clock value.
     */
    const { fetchedCNodeUser, error } = await fetchExportFromNode({
      nodeEndpointToFetchFrom: creatorNodeEndpoint,
      wallet,
      clockRangeMin: localMaxClockVal + 1,
      selfEndpoint: thisContentNodeEndpoint,
      logger
    })
    if (!_.isEmpty(error)) {
      returnValue = {
        error: new Error(error.message),
        result: error.code
      }
      throw returnValue.error
    }

    const {
      clock: fetchedLatestClockVal,
      clockRecords: fetchedClockRecords,
      walletPublicKey: fetchedWalletPublicKey,
      latestBlockNumber: fetchedLatestBlockNumber
    } = fetchedCNodeUser

    // Short-circuit if already up to date -- no sync required
    if (fetchedLatestClockVal === localMaxClockVal) {
      logger.info(
        `User ${fetchedWalletPublicKey} already up to date! Both nodes have latest clock value ${localMaxClockVal}`
      )
      return {
        result: 'success_clocks_already_match'
      }
    }

    /**
     * Replace CNodeUser's local DB state with retrieved data + fetch + save missing files.
     */

    // Use user's replica set as gateways for content fetching in saveFileForMultihashToFS.
    // Note that sync is only called on secondaries so `myCnodeEndpoint` below always represents a secondary.
    let gatewaysToTry = []
    try {
      const myCnodeEndpoint = await getOwnEndpoint(serviceRegistry)

      // Filter out current node from user's replica set
      gatewaysToTry = [
        userReplicaSet.primary,
        userReplicaSet.secondary1,
        userReplicaSet.secondary2
      ].filter((url) => url !== myCnodeEndpoint)
    } catch (e) {
      tracing.recordException(e)
      logger.error(
        `Couldn't filter out own endpoint from user's replica set to use use as cnode gateways in saveFileForMultihashToFS - ${e.message}`
      )
    }

    /**
     * This node (secondary) must compare its local clock state against clock state received in export from primary.
     * Only allow sync if received clock state contains new data and is contiguous with existing data.
     */

    const maxClockRecordId = Math.max(
      ...fetchedClockRecords.map((record) => record.clock)
    )

    // Error if returned data is not within requested range
    if (fetchedLatestClockVal < localMaxClockVal) {
      returnValue = {
        error: new Error(
          `Cannot sync for localMaxClockVal ${localMaxClockVal} - imported data has max clock val ${fetchedLatestClockVal}`
        ),
        result: 'failure_inconsistent_clock'
      }
      throw returnValue.error
    } else if (
      localMaxClockVal !== -1 &&
      fetchedClockRecords[0] &&
      fetchedClockRecords[0].clock !== localMaxClockVal + 1
    ) {
      returnValue = {
        error: new Error(
          `Cannot sync - imported data is not contiguous. Local max clock val = ${localMaxClockVal} and imported min clock val ${fetchedClockRecords[0].clock}`
        ),
        result: 'failure_import_not_contiguous'
      }
      throw returnValue.error
    } else if (
      !_.isEmpty(fetchedClockRecords) &&
      maxClockRecordId !== fetchedLatestClockVal
    ) {
      returnValue = {
        error: new Error(
          `Cannot sync - imported data is not consistent. Imported max clock val = ${fetchedLatestClockVal} and imported max ClockRecord val ${maxClockRecordId}`
        ),
        result: 'failure_import_not_consistent'
      }
      throw returnValue.error
    }

    // All DB updates must happen in single atomic tx - partial state updates will lead to data loss
    const transaction = await models.sequelize.transaction()

    /**
     * Process all DB updates for cnodeUser
     */
    try {
      logger.info(
        `beginning add ops for cnodeUser wallet ${fetchedWalletPublicKey}`
      )

      /**
       * Update CNodeUser entry if exists else create new
       *
       * Cannot use upsert since it fails to use default value for cnodeUserUUID per this issue https://github.com/sequelize/sequelize/issues/3247
       */

      let cnodeUser

      // Fetch current cnodeUser from DB
      const cnodeUserRecord = await models.CNodeUser.findOne({
        where: { walletPublicKey: fetchedWalletPublicKey },
        transaction
      })

      /**
       * The first sync for a user will enter else case where no local cnodeUserRecord is found
       *    creating a new entry with a new auto-generated cnodeUserUUID.
       * Every subsequent sync will enter the if case and update the existing local cnodeUserRecord.
       */
      if (cnodeUserRecord) {
        logger.info(
          `cNodeUserRecord was non-empty -- updating CNodeUser for cnodeUser wallet ${fetchedWalletPublicKey}. Clock value: ${fetchedLatestClockVal}`
        )
        const [numRowsUpdated, respObj] = await models.CNodeUser.update(
          {
            lastLogin: fetchedCNodeUser.lastLogin,
            latestBlockNumber: fetchedLatestBlockNumber,
            clock: fetchedLatestClockVal,
            createdAt: fetchedCNodeUser.createdAt
          },
          {
            where: { walletPublicKey: fetchedWalletPublicKey },
            fields: [
              'lastLogin',
              'latestBlockNumber',
              'clock',
              'createdAt',
              'updatedAt'
            ],
            returning: true,
            transaction
          }
        )

        // Error if update failed
        if (numRowsUpdated !== 1 || respObj.length !== 1) {
          returnValue = {
            error: new Error(
              `Failed to update cnodeUser row for cnodeUser wallet ${fetchedWalletPublicKey}`
            ),
            result: 'failure_db_transaction'
          }
          throw returnValue.error
        }
        cnodeUser = respObj[0]
      } else {
        logger.info(
          `cNodeUserRecord was empty -- inserting CNodeUser for cnodeUser wallet ${fetchedWalletPublicKey}. Clock value: ${fetchedLatestClockVal}`
        )
        // Will throw error if creation fails
        cnodeUser = await models.CNodeUser.create(
          {
            walletPublicKey: fetchedWalletPublicKey,
            lastLogin: fetchedCNodeUser.lastLogin,
            latestBlockNumber: fetchedLatestBlockNumber,
            clock: fetchedLatestClockVal,
            createdAt: fetchedCNodeUser.createdAt
          },
          {
            returning: true,
            transaction
          }
        )
      }

      const cnodeUserUUID = cnodeUser.cnodeUserUUID
      logger.info(
        `Upserted CNodeUser for cnodeUser wallet ${fetchedWalletPublicKey}: cnodeUserUUID: ${cnodeUserUUID}. Clock value: ${fetchedLatestClockVal}`
      )

      /**
       * Populate all new data for fetched cnodeUser
       * Always use local cnodeUserUUID in favor of cnodeUserUUID in exported dataset to ensure consistency
       */

      /*
       * Make list of all track Files to add after track creation
       *
       * Files with trackBlockchainIds cannot be created until tracks have been created,
       *    but tracks cannot be created until metadata and cover art files have been created.
       */

      const trackFiles = fetchedCNodeUser.files.filter((file) =>
        models.File.TrackTypes.includes(file.type)
      )
      const nonTrackFiles = fetchedCNodeUser.files.filter((file) =>
        models.File.NonTrackTypes.includes(file.type)
      )
      const numTotalFiles = trackFiles.length + nonTrackFiles.length

      const CIDsThatFailedSaveFileOp = new Set()

      // Save all track files to disk in batches (to limit concurrent load)
      for (let i = 0; i < trackFiles.length; i += FileSaveMaxConcurrency) {
        const trackFilesSlice = trackFiles.slice(i, i + FileSaveMaxConcurrency)
        logger.info(
          `TrackFiles saveFileForMultihashToFS - processing trackFiles ${i} to ${
            i + FileSaveMaxConcurrency
          } out of total ${trackFiles.length}...`
        )

        /**
         * Fetch content for each CID + save to FS
         * Record any CIDs that failed retrieval/saving for later use
         * @notice `saveFileForMultihashToFS()` should never reject - it will return error indicator for post processing
         */
        await Promise.all(
          trackFilesSlice.map(async (trackFile) => {
            const error = await saveFileForMultihashToFS(
              libs,
              logger,
              trackFile.multihash,
              trackFile.storagePath,
              gatewaysToTry,
              null,
              trackFile.trackBlockchainId
            )

            // If saveFile op failed, record CID for later processing
            if (error) {
              CIDsThatFailedSaveFileOp.add(trackFile.multihash)
            }
          })
        )
      }
      logger.info('Saved all track files to disk.')

      // Save all non-track files to disk in batches (to limit concurrent load)
      for (let i = 0; i < nonTrackFiles.length; i += FileSaveMaxConcurrency) {
        const nonTrackFilesSlice = nonTrackFiles.slice(
          i,
          i + FileSaveMaxConcurrency
        )
        logger.info(
          `NonTrackFiles saveFileForMultihashToFS - processing files ${i} to ${
            i + FileSaveMaxConcurrency
          } out of total ${nonTrackFiles.length}...`
        )
        await Promise.all(
          nonTrackFilesSlice.map(async (nonTrackFile) => {
            // Skip over directories since there's no actual content to sync
            // The files inside the directory are synced separately
            if (nonTrackFile.type !== 'dir') {
              const multihash = nonTrackFile.multihash

              // if it's an image file, we need to pass in the actual filename because the gateway request is /ipfs/Qm123/<filename>
              // need to also check fileName is not null to make sure it's a dir-style image. non-dir images won't have a 'fileName' db column
              let error
              if (
                nonTrackFile.type === 'image' &&
                nonTrackFile.fileName !== null
              ) {
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
            }
          })
        )
      }
      logger.info('Saved all non-track files to disk.')

      /**
       * Handle scenario where failed to retrieve/save > 0 CIDs
       * Reject sync if number of failures for user is below threshold, else proceed and mark unretrieved files as skipped
       */
      const numCIDsThatFailedSaveFileOp = CIDsThatFailedSaveFileOp.size
      if (numCIDsThatFailedSaveFileOp > 0) {
        const userSyncFailureCount =
          await UserSyncFailureCountService.incrementFailureCount(
            fetchedWalletPublicKey
          )

        // Throw error if failure threshold not yet reached
        if (userSyncFailureCount < SyncRequestMaxUserFailureCountBeforeSkip) {
          const errorMsg = `User Sync failed due to ${numCIDsThatFailedSaveFileOp} failing saveFileForMultihashToFS op. userSyncFailureCount = ${userSyncFailureCount} // SyncRequestMaxUserFailureCountBeforeSkip = ${SyncRequestMaxUserFailureCountBeforeSkip}`
          logger.error(errorMsg)
          returnValue = {
            error: new Error(errorMsg),
            result: 'failure_skip_threshold_not_reached'
          }
          throw returnValue.error

          // If max failure threshold reached, continue with sync and reset failure count
        } else {
          // Reset falure count so subsequent user syncs will not always succeed & skip
          await UserSyncFailureCountService.resetFailureCount(
            fetchedWalletPublicKey
          )

          logger.info(
            `User Sync continuing with ${numCIDsThatFailedSaveFileOp} skipped files, since SyncRequestMaxUserFailureCountBeforeSkip (${SyncRequestMaxUserFailureCountBeforeSkip}) reached.`
          )
        }
      } else {
        // Reset failure count if all files were successfully saved
        await UserSyncFailureCountService.resetFailureCount(
          fetchedWalletPublicKey
        )
      }

      /**
       * Write all records to DB
       */

      await models.ClockRecord.bulkCreate(
        fetchedClockRecords.map((clockRecord) => ({
          ...clockRecord,
          cnodeUserUUID
        })),
        { transaction }
      )
      logger.info('Saved all ClockRecord entries to DB')

      await models.File.bulkCreate(
        nonTrackFiles.map((file) => {
          if (CIDsThatFailedSaveFileOp.has(file.multihash)) {
            file.skipped = true // defaults to false
          }
          return {
            ...file,
            trackBlockchainId: null,
            cnodeUserUUID
          }
        }),
        { transaction }
      )
      logger.info('Saved all non-track File entries to DB')

      await models.Track.bulkCreate(
        fetchedCNodeUser.tracks.map((track) => ({
          ...track,
          cnodeUserUUID
        })),
        { transaction }
      )
      logger.info('Saved all Track entries to DB')

      await models.File.bulkCreate(
        trackFiles.map((trackFile) => {
          if (CIDsThatFailedSaveFileOp.has(trackFile.multihash)) {
            trackFile.skipped = true // defaults to false
          }
          return {
            ...trackFile,
            cnodeUserUUID
          }
        }),
        { transaction }
      )
      logger.info('Saved all track File entries to DB')

      await models.AudiusUser.bulkCreate(
        fetchedCNodeUser.audiusUsers.map((audiusUser) => ({
          ...audiusUser,
          cnodeUserUUID
        })),
        { transaction }
      )
      logger.info('Saved all AudiusUser entries to DB')

      await transaction.commit()

      logger.info(
        `Transaction successfully committed for cnodeUser wallet ${fetchedWalletPublicKey} with ${numTotalFiles} files processed and ${numCIDsThatFailedSaveFileOp} skipped.`
      )

      // track that sync for this user was successful
      await SyncHistoryAggregator.recordSyncSuccess(fetchedWalletPublicKey)

      logger.info(
        `Sync complete for wallet: ${wallet}. Status: Success. Duration sync: ${
          Date.now() - start
        }. From endpoint ${creatorNodeEndpoint}.`
      )

      return { result: 'success' }
    } catch (e) {
      logger.error(
        `Transaction failed for cnodeUser wallet ${fetchedWalletPublicKey}`,
        e
      )

      await transaction.rollback()

      try {
        const numRowsUpdated = await DBManager.fixInconsistentUser(
          fetchedCNodeUser.cnodeUserUUID
        )
        logger.warn(
          `fixInconsistentUser() executed for ${fetchedCNodeUser.cnodeUserUUID} - numRowsUpdated:${numRowsUpdated}`
        )
      } catch (e) {
        logger.error(
          `fixInconsistentUser() error for ${fetchedCNodeUser.cnodeUserUUID} - ${e.message}`
        )
      }

      return _.isEmpty(returnValue)
        ? {
            error: new Error(e),
            result: 'failure_db_transaction'
          }
        : returnValue
    }
  } catch (e) {
    tracing.recordException(e)
    await SyncHistoryAggregator.recordSyncFail(wallet)
    logger.error(
      `Sync complete for wallet: ${wallet}. Status: Error, message: ${
        e.message
      }. Duration sync: ${
        Date.now() - start
      }. From endpoint ${creatorNodeEndpoint}.`
    )

    return _.isEmpty(returnValue)
      ? {
          error: new Error(e),
          result: 'failure_sync_secondary_from_primary'
        }
      : returnValue
  } finally {
    try {
      await redis.WalletWriteLock.release(wallet)
    } catch (e) {
      tracing.recordException(e)
      logger.warn(
        `Failure to release write lock for ${wallet} with error ${e.message}`
      )
    }
  }
}

/**
 * This function is only run on secondaries, to export and sync data from a user's primary.
 *
 * @notice - By design, will reject any syncs with non-contiguous clock values. For now,
 *    any data corruption from primary needs to be handled separately and should not be replicated.
 *
 * @notice - There is a maxExportClockValueRange enforced in export, meaning that some syncs will
 *    only replicate partial data state. This is by design, and state machine will trigger repeated syncs
 *    with progressively increasing clock values until secondaries have completely synced up.
 *    Secondaries have no knowledge of the current data state on primary, they simply replicate
 *    what they receive in each export.
 */
async function _secondarySyncFromPrimary({
  serviceRegistry,
  wallet,
  creatorNodeEndpoint,
  forceResyncConfig,
  logContext,
  forceWipe = false,
  blockNumber = null
}) {
  const { prometheusRegistry } = serviceRegistry
  const secondarySyncFromPrimaryMetric = prometheusRegistry.getMetric(
    prometheusRegistry.metricNames
      .SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM
  )
  const metricEndTimerFn = secondarySyncFromPrimaryMetric.startTimer()

  // forceWipe only wipes data from the secondary and and doesn't resync from the primary.
  // This flag takes precedence over forceResync, which wipes and then resyncs, if both are present
  let mode = 'default'
  if (forceResyncConfig?.forceResync) mode = 'force_resync'
  if (forceWipe) mode = 'force_wipe'

  const { error, result } = await handleSyncFromPrimary({
    serviceRegistry,
    wallet,
    creatorNodeEndpoint,
    blockNumber,
    forceResyncConfig,
    forceWipe,
    logContext
  })
  metricEndTimerFn({ result, mode })
  tracing.setSpanAttribute('result', result)
  tracing.setSpanAttribute('mode', mode)

  if (error) {
    throw new Error(error)
  }

  return { result }
}

const secondarySyncFromPrimary = instrumentTracing({
  fn: _secondarySyncFromPrimary,
  options: {
    attributes: {
      [tracing.CODE_FILEPATH]: __filename
    }
  }
})

module.exports = secondarySyncFromPrimary
