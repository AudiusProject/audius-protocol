const _ = require('lodash')
const axios = require('axios')

const { logger: genericLogger } = require('../../logging')
const models = require('../../models')
const { saveFileForMultihashToFS } = require('../../fileManager')
const {
  getOwnEndpoint,
  getUserReplicaSetEndpointsFromDiscovery
} = require('../../middlewares')
const SyncHistoryAggregator = require('../../snapbackSM/syncHistoryAggregator')
const DBManager = require('../../dbManager')
const { shouldForceResync } = require('./secondarySyncFromPrimaryUtils')

const handleSyncFromPrimary = async ({
  serviceRegistry,
  wallet,
  creatorNodeEndpoint,
  forceResyncConfig,
  logContext,
  blockNumber = null
}) => {
  const { nodeConfig, redis, libs } = serviceRegistry
  const FileSaveMaxConcurrency = nodeConfig.get(
    'nodeSyncFileSaveMaxConcurrency'
  )

  const start = Date.now()

  genericLogger.info('begin nodesync for ', wallet, 'time', start)

  const logPrefix = `[secondarySyncFromPrimary][wallet=${wallet}]`
  try {
    await redis.WalletWriteLock.acquire(
      wallet,
      redis.WalletWriteLock.VALID_ACQUIRERS.SecondarySyncFromPrimary
    )
  } catch (e) {
    return {
      error: new Error(
        `Cannot change state of wallet ${wallet}. Node sync currently in progress.`
      ),
      result: 'failure_sync_in_progress'
    }
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

  let returnValue = {}
  try {
    let localMaxClockVal
    if (forceResync) {
      genericLogger.warn(`${logPrefix} Forcing resync..`)

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
    } else {
      // Query own latest clockValue and call export with that value + 1; export from 0 for first time sync
      const cnodeUser = await models.CNodeUser.findOne({
        where: { walletPublicKey: wallet }
      })
      localMaxClockVal = cnodeUser ? cnodeUser.clock : -1
    }

    /**
     * Fetch data export from creatorNodeEndpoint for given walletPublicKeys and clock value range
     *
     * Secondary requests export of new data by passing its current max clock value in the request.
     * Primary builds an export object of all data beginning from the next clock value.
     */

    // Build export query params
    const exportQueryParams = {
      wallet_public_key: wallet,
      clock_range_min: localMaxClockVal + 1
    }

    // This is used only for logging by primary to record endpoint of requesting node
    if (nodeConfig.get('creatorNodeEndpoint')) {
      exportQueryParams.source_endpoint = nodeConfig.get('creatorNodeEndpoint')
    }

    const resp = await axios({
      method: 'get',
      baseURL: creatorNodeEndpoint,
      url: '/export',
      params: exportQueryParams,
      responseType: 'json',
      /** @notice - this request timeout is arbitrarily large for now until we find an appropriate value */
      timeout: 300000 /* 5m = 300000ms */
    })

    if (resp.status !== 200) {
      genericLogger.error(
        logPrefix,
        `Failed to retrieve export from ${creatorNodeEndpoint} for wallet`,
        wallet
      )
      returnValue = {
        error: new Error(resp.data.error),
        result: 'failure_export_wallet'
      }
      throw returnValue.error
    }

    // TODO - explain patch
    if (!resp.data) {
      if (resp.request && resp.request.responseText) {
        resp.data = JSON.parse(resp.request.responseText)
      } else {
        returnValue = {
          error: new Error(`Malformed response from ${creatorNodeEndpoint}.`),
          result: 'failure_malformed_export'
        }
        throw returnValue.error
      }
    }

    const { data: body } = resp
    if (
      !body.data.hasOwnProperty('cnodeUsers') ||
      _.isEmpty(body.data.cnodeUsers)
    ) {
      returnValue = {
        error: new Error(`Malformed response from ${creatorNodeEndpoint}.`),
        result: 'failure_malformed_export'
      }
      throw returnValue.error
    }

    const fetchedCNodeUser = Object.values(body.data.cnodeUsers)[0]
    if (!fetchedCNodeUser.hasOwnProperty('walletPublicKey')) {
      returnValue = {
        error: new Error(
          `Malformed response received from ${creatorNodeEndpoint}. "walletPublicKey" property not found on CNodeUser in response object`
        ),
        result: 'failure_malformed_export'
      }
      throw returnValue.error
    }

    const {
      clock: fetchedLatestClockVal,
      clockRecords: fetchedClockRecords,
      walletPublicKey: fetchedWalletPublicKey,
      latestBlockNumber: fetchedLatestBlockNumber
    } = fetchedCNodeUser
    if (wallet !== fetchedWalletPublicKey) {
      returnValue = {
        error: new Error(
          `Malformed response from ${creatorNodeEndpoint}. Returned data for walletPublicKey that was not requested.`
        ),
        result: 'failure_malformed_export'
      }
      throw returnValue.error
    }

    genericLogger.info(
      logPrefix,
      `Successful export from ${creatorNodeEndpoint} for wallet ${wallet} and requested min clock ${
        localMaxClockVal + 1
      }`
    )

    // Short-circuit if already up to date -- no sync required
    if (fetchedLatestClockVal === localMaxClockVal) {
      genericLogger.info(
        logPrefix,
        `User ${fetchedWalletPublicKey} already up to date! Both nodes have latest clock value ${localMaxClockVal}`
      )
      return {
        result: 'success_clocks_already_match'
      }
    }

    /**
     * Replace CNodeUser's local DB state with retrieved data + fetch + save missing files.
     */

    // Retrieve user's replica set to use as gateways for content fetching in saveFileForMultihashToFS.
    // Note that sync is only called on secondaries so `myCnodeEndpoint` below always represents a secondary.
    let userReplicaSet = []
    try {
      const myCnodeEndpoint = await getOwnEndpoint(serviceRegistry)
      userReplicaSet = await getUserReplicaSetEndpointsFromDiscovery({
        libs,
        logger: genericLogger,
        wallet: fetchedWalletPublicKey,
        blockNumber,
        ensurePrimary: false,
        myCnodeEndpoint
      })

      // Filter out current node from user's replica set
      userReplicaSet = userReplicaSet.filter((url) => url !== myCnodeEndpoint)

      // Spread + set uniq's the array
      userReplicaSet = [...new Set(userReplicaSet)]
    } catch (e) {
      genericLogger.error(
        logPrefix,
        `Couldn't get user's replica set, can't use cnode gateways in saveFileForMultihashToFS - ${e.message}`
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
      genericLogger.info(
        logPrefix,
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
        genericLogger.info(
          logPrefix,
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
        genericLogger.info(
          logPrefix,
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
      genericLogger.info(
        logPrefix,
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
        genericLogger.info(
          logPrefix,
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
              genericLogger,
              trackFile.multihash,
              trackFile.storagePath,
              userReplicaSet,
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
      genericLogger.info(logPrefix, 'Saved all track files to disk.')

      // Save all non-track files to disk in batches (to limit concurrent load)
      for (let i = 0; i < nonTrackFiles.length; i += FileSaveMaxConcurrency) {
        const nonTrackFilesSlice = nonTrackFiles.slice(
          i,
          i + FileSaveMaxConcurrency
        )
        genericLogger.info(
          logPrefix,
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
                  genericLogger,
                  multihash,
                  nonTrackFile.storagePath,
                  userReplicaSet,
                  nonTrackFile.fileName
                )
              } else {
                error = await saveFileForMultihashToFS(
                  libs,
                  genericLogger,
                  multihash,
                  nonTrackFile.storagePath,
                  userReplicaSet
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
      genericLogger.info(logPrefix, 'Saved all non-track files to disk.')

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
      genericLogger.info(logPrefix, 'Saved all ClockRecord entries to DB')

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
      genericLogger.info(logPrefix, 'Saved all non-track File entries to DB')

      await models.Track.bulkCreate(
        fetchedCNodeUser.tracks.map((track) => ({
          ...track,
          cnodeUserUUID
        })),
        { transaction }
      )
      genericLogger.info(logPrefix, 'Saved all Track entries to DB')

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
      genericLogger.info(logPrefix, 'Saved all track File entries to DB')

      await models.AudiusUser.bulkCreate(
        fetchedCNodeUser.audiusUsers.map((audiusUser) => ({
          ...audiusUser,
          cnodeUserUUID
        })),
        { transaction }
      )
      genericLogger.info(logPrefix, 'Saved all AudiusUser entries to DB')

      await transaction.commit()

      genericLogger.info(
        logPrefix,
        `Transaction successfully committed for cnodeUser wallet ${fetchedWalletPublicKey} with ${numTotalFiles} files processed and ${CIDsThatFailedSaveFileOp.size} skipped.`
      )

      // track that sync for this user was successful
      await SyncHistoryAggregator.recordSyncSuccess(fetchedWalletPublicKey)

      genericLogger.info(
        logPrefix,
        `Sync complete for wallet: ${wallet}. Status: Success. Duration sync: ${
          Date.now() - start
        }. From endpoint ${creatorNodeEndpoint}.`
      )

      return { result: 'success' }
    } catch (e) {
      genericLogger.error(
        logPrefix,
        `Transaction failed for cnodeUser wallet ${fetchedWalletPublicKey}`,
        e
      )

      await transaction.rollback()

      try {
        const numRowsUpdated = await DBManager.fixInconsistentUser(
          fetchedCNodeUser.cnodeUserUUID
        )
        genericLogger.warn(
          logPrefix,
          `fixInconsistentUser() executed for ${fetchedCNodeUser.cnodeUserUUID} - numRowsUpdated:${numRowsUpdated}`
        )
      } catch (e) {
        genericLogger.error(
          logPrefix,
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
    await SyncHistoryAggregator.recordSyncFail(wallet)
    genericLogger.error(
      logPrefix,
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
      genericLogger.warn(
        logPrefix,
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
async function secondarySyncFromPrimary({
  serviceRegistry,
  wallet,
  creatorNodeEndpoint,
  forceResyncConfig,
  logContext,
  blockNumber = null
}) {
  const { prometheusRegistry } = serviceRegistry
  const secondarySyncFromPrimaryMetric = prometheusRegistry.getMetric(
    prometheusRegistry.metricNames
      .SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM
  )
  const metricEndTimerFn = secondarySyncFromPrimaryMetric.startTimer()

  const mode = forceResyncConfig?.forceResync ? 'force_resync' : 'default'

  const { error, result } = await handleSyncFromPrimary({
    serviceRegistry,
    wallet,
    creatorNodeEndpoint,
    blockNumber,
    forceResyncConfig,
    logContext
  })
  metricEndTimerFn({ result, mode })

  if (error) {
    throw new Error(error)
  }

  return { result }
}

module.exports = secondarySyncFromPrimary
