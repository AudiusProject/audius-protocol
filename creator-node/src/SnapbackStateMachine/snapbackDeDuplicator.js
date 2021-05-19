/**
 * Ensure a sync for (syncType, userWallet, secondaryEndpoint) can only be enqueued once
 * This is used to ensure multiple concurrent sync tasks are not being redundantly used on a single user
 * Implemented with an in-memory map of string(syncType, userWallet, secondaryEndpoint) -> object(syncJobInfo)
 *
 * @dev We maintain this map to maximize query performance; Bull does not provide any api for querying
 *    jobs by property and would require a linear iteration over the full job list
 */
class SyncDeDuplicator {
  constructor () {
    this.waitingSyncsByUserWalletMap = {}
  }

  /** Stringify properties to enable storage with a flat map */
  _getSyncKey (syncType, userWallet, secondaryEndpoint) {
    return `${syncType}::${userWallet}::${secondaryEndpoint}`
  }

  /** Return job info of sync with given properties if present else null */
  getDuplicateSyncJobInfo (syncType, userWallet, secondaryEndpoint) {
    const syncKey = this._getSyncKey(syncType, userWallet, secondaryEndpoint)

    const duplicateSyncJobInfo = this.waitingSyncsByUserWalletMap[syncKey]
    return duplicateSyncJobInfo || null
  }

  /** Record job info for sync with given properties */
  recordSync (syncType, userWallet, secondaryEndpoint, jobInfo) {
    const syncKey = this._getSyncKey(syncType, userWallet, secondaryEndpoint)

    this.waitingSyncsByUserWalletMap[syncKey] = jobInfo
  }

  /** Remove sync with given properties */
  removeSync (syncType, userWallet, secondaryEndpoint) {
    const syncKey = this._getSyncKey(syncType, userWallet, secondaryEndpoint)

    delete this.waitingSyncsByUserWalletMap[syncKey]
  }
}

module.exports = SyncDeDuplicator
