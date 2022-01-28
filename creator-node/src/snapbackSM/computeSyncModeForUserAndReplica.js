const DBManager = require('../dbManager.js')
const retry = require('async-retry')

/**
 * Sync mode for a (primary, secondary) pair for a user
 */
const SyncMode = Object.freeze({
  None: 'NONE',
  SecondaryShouldSync: 'SECONDARY_SHOULD_SYNC',
  PrimaryShouldSync: 'PRIMARY_SHOULD_SYNC'
})

const FetchFilesHashNumRetries = 3

/**
 * Given user state info, determines required sync mode for user and replica. This fn is called for each (primary, secondary) pair
 * @notice Is used when both replicas are running version >= 0.3.51
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
    !Number.isInteger(primaryClock) ||
    !Number.isInteger(secondaryClock) ||
    // `null` is a valid filesHash value; `undefined` is not
    primaryFilesHash === undefined ||
    secondaryFilesHash === undefined
  ) {
    throw new Error(
      '[computeSyncModeForUserAndReplica] Error: Missing or invalid params'
    )
  }

  if (
    primaryClock === secondaryClock &&
    primaryFilesHash === secondaryFilesHash
  ) {
    /**
     * Nodes have identical data -> no sync needed
     */
    return SyncMode.None
  } else if (
    primaryClock === secondaryClock &&
    primaryFilesHash !== secondaryFilesHash
  ) {
    /**
     * If clocks are same but filesHashes are not, this means secondary and primary states for user
     *    have diverged. To fix this issue, primary should sync content from secondary and
     *    subsequently force secondary to resync state from primary.
     */
    return SyncMode.PrimaryShouldSync
  } else if (primaryClock < secondaryClock) {
    /**
     * Secondary has more data than primary -> primary must sync from secondary
     */
    return SyncMode.PrimaryShouldSync
  } else if (primaryClock > secondaryClock && secondaryFilesHash === null) {
    /**
     * secondaryFilesHash will be null if secondary has no files for user -> secondary must sync from primary
     */
    return SyncMode.SecondaryShouldSync
  } else if (primaryClock > secondaryClock && secondaryFilesHash !== null) {
    /**
     * If primaryClock > secondaryClock, need to check that nodes have same content for each clock value. To do this, we compute filesHash from primary matching clock range from secondary.
     */
    try {
      // Throws error if failure after all retries
      const primaryFilesHashForRange = await retry(
        async () =>
          DBManager.fetchFilesHashFromDB({
            lookupKey: { lookupWallet: wallet },
            clockMin: 0,
            clockMax: secondaryClock + 1
          }),
        { retries: FetchFilesHashNumRetries }
      )

      if (primaryFilesHashForRange === secondaryFilesHash) {
        return SyncMode.SecondaryShouldSync
      } else {
        return SyncMode.PrimaryShouldSync
      }
    } catch (e) {
      const errorMsg = `[computeSyncModeForUserAndReplica] Error: failed DBManager.fetchFilesHashFromDB() - ${e.message}`
      logger.error(errorMsg)
      throw new Error(errorMsg)
    }
  } else {
    return SyncMode.None
  }
}

/**
 * Given user state info, determines required sync mode for user and replica. This fn is called for each (primary, secondary) pair
 * @notice Is used when at least 1 replica is running version < 0.3.51
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
