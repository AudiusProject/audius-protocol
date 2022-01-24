const retry = require('async-retry')

const DBManager = require('../dbManager.js')

/**
 * Sync mode for a (primary, secondary) pair for a user
 */
const SyncMode = Object.freeze({
  None: 'NONE',
  SecondaryShouldSync: 'SECONDARY_SHOULD_SYNC',
  PrimaryShouldSync: 'PRIMARY_SHOULD_SYNC'
})

const FetchFilesHashNumAttempts = 4

/**
 * Given user state info, determines required sync mode for user and replica. This fn is called for each (primary, secondary) pair
 * @notice Is used when both replicas are running version >= 0.3.50
 * @param {Object} param
 * @param {string} param.wallet user wallet
 * @param {number} param.primaryClock clock value on user's primary
 * @param {number} param.secondaryClock clock value on user's secondary
 * @param {string} param.primaryFilesHash filesHash on user's primary
 * @param {string} param.secondaryFilesHash filesHash on user's secondary
 * @returns {SyncMode} syncMode one of None, SecondaryShouldSync, PrimaryShouldSync
 */
async function computeSyncModeForUserAndReplica({
  wallet,
  primaryClock,
  secondaryClock,
  primaryFilesHash,
  secondaryFilesHash,
  logger
}) {
  if (
    !(primaryClock && primaryClock !== 0) ||
    !(secondaryClock && secondaryClock !== 0) ||
    primaryFilesHash === undefined ||
    secondaryFilesHash === undefined
  ) {
    throw new Error(
      '[computeSyncModeForUserAndReplica] Error: Missing or invalid params'
    )
  }

  let syncMode = SyncMode.None

  if (primaryClock === secondaryClock) {
    if (primaryFilesHash === secondaryFilesHash) {
      syncMode = SyncMode.None
    } /* primaryFilesHash !== secondaryFilesHash */ else {
      syncMode = SyncMode.PrimaryShouldSync
    }
  } else if (primaryClock < secondaryClock) {
    syncMode = SyncMode.PrimaryShouldSync
  } /* primaryClock > secondaryClock */ else {
    // secondaryFilesHash will be null if secondary has no files for user
    if (secondaryFilesHash === null) {
      syncMode = SyncMode.SecondaryShouldSync
    } /* secondaryFilesHash is defined */ else {
      // fetch primary filesHash for clockRange [0, secondaryClock]
      try {
        let primaryFilesHashForRange
        let error
        let attemptNum = 1
        while (attemptNum++ < FetchFilesHashNumAttempts) {
          try {
            primaryFilesHashForRange = await DBManager.fetchFilesHashFromDB({
              lookupKey: { lookupWallet: wallet },
              clockMin: 0,
              clockMax: secondaryClock + 1
            })
          } catch (e) {
            error = e
          }
        }
        if (primaryFilesHashForRange === undefined) {
          throw new Error(error)
        }

        if (primaryFilesHashForRange === secondaryFilesHash) {
          syncMode = SyncMode.SecondaryShouldSync
        } else {
          syncMode = SyncMode.PrimaryShouldSync
        }
      } catch (e) {
        // With sufficient retries, this should never happen, log and skip
        syncMode = SyncMode.None

        logger.error(
          `[computeSyncModeForUserAndReplica] Error: failed DBManager.fetchFilesHashFromDB() - ${e.message}`
        )
      }
    }
  }

  return syncMode
}

/**
 * Given user state info, determines required sync mode for user and replica. This fn is called for each (primary, secondary) pair
 * @notice Is used when at least 1 replica is running version < 0.3.50
 * @param {Object} param
 * @param {string} param.wallet user wallet
 * @param {number} param.primaryClock clock value on user's primary
 * @param {number} param.secondaryClock clock value on user's secondary
 * @returns {SyncMode} syncMode one of None, SecondaryShouldSync, PrimaryShouldSync
 */
function computeSyncModeForUserAndReplicaLegacy({
  primaryClock,
  secondaryClock
}) {
  if (primaryClock > secondaryClock) {
    return SyncMode.SecondaryShouldSync
  } else {
    return SyncMode.None
  }
}

module.exports = {
  SyncMode,
  computeSyncModeForUserAndReplica,
  computeSyncModeForUserAndReplicaLegacy
}
