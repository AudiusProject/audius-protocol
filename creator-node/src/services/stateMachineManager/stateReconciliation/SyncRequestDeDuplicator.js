const { instrumentTracing, tracing } = require('../../../tracer')

/**
 * Ensure a sync request for (syncType, userWallet, secondaryEndpoint) can only be enqueued once
 * This is used to ensure multiple concurrent sync tasks are not being redundantly used on a single user
 * Implemented with an in-memory map of string(syncType, userWallet, secondaryEndpoint) -> object(syncJobProps)
 *
 * @dev We maintain this map to maximize query performance; Bull does not provide any api for querying
 *    jobs by property and would require a linear iteration over the full job list
 */
class SyncRequestDeDuplicator {
  constructor() {
    this.waitingSyncsByUserWalletMap = {}
  }

  /** Stringify properties to enable storage with a flat map */
  _getSyncKey(syncType, userWallet, secondaryEndpoint, immediate = false) {
    return `${syncType}::${userWallet}::${secondaryEndpoint}::${immediate}`
  }

  /** Return job info of sync with given properties if present else null */
  getDuplicateSyncJobInfo(
    syncType,
    userWallet,
    secondaryEndpoint,
    immediate = false
  ) {
    const that = this
    const handler = instrumentTracing({
      name: 'getDuplicateSyncJobInfo',
      fn: () => {
        const syncKey = that._getSyncKey(
          syncType,
          userWallet,
          secondaryEndpoint,
          immediate
        )

        const duplicateSyncJobInfo = that.waitingSyncsByUserWalletMap[syncKey]
        return duplicateSyncJobInfo || null
      }
    })

    return handler(syncType, userWallet, secondaryEndpoint, immediate)
  }

  /** Record job info for sync with given properties */
  recordSync(
    syncType,
    userWallet,
    secondaryEndpoint,
    immediate = false,
    jobProps
  ) {
    const that = this
    instrumentTracing({
      name: 'recordSync',
      fn: () => {
        const syncKey = that._getSyncKey(
          syncType,
          userWallet,
          secondaryEndpoint,
          immediate
        )
        tracing.setSpanAttribute('syncKey', syncKey)

        that.waitingSyncsByUserWalletMap[syncKey] = jobProps
      }
    })(syncType, userWallet, secondaryEndpoint, immediate, jobProps)
  }

  /** Remove sync with given properties */
  removeSync(syncType, userWallet, secondaryEndpoint, immediate = false) {
    const that = this
    instrumentTracing({
      name: 'removeSync',
      fn: () => {
        const syncKey = that._getSyncKey(
          syncType,
          userWallet,
          secondaryEndpoint,
          immediate
        )

        delete that.waitingSyncsByUserWalletMap[syncKey]
      }
    })(syncType, userWallet, secondaryEndpoint, immediate)
  }
}

module.exports = new SyncRequestDeDuplicator()
