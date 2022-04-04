/**
 * Tracks user SyncRequest failure counts (on secondary)
 * Records in-memory, state reset with each node restart (this is ok)
 */
const UserSyncFailureCountManager = {
  // map of wallet -> (int) failure count
  failureCounts: {},

  resetFailureCount: (wallet) => {
    UserSyncFailureCountManager.failureCounts[wallet] = 0
  },

  incrementFailureCount: (wallet) => {
    if (wallet in UserSyncFailureCountManager.failureCounts) {
      UserSyncFailureCountManager.failureCounts[wallet] += 1
    } else {
      UserSyncFailureCountManager.failureCounts[wallet] = 1
    }

    return UserSyncFailureCountManager.failureCounts[wallet]
  }
}

module.exports = UserSyncFailureCountManager
