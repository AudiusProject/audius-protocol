const _ = require('lodash')

const redisClient = require('../../../redis')

/**
 * Ensure a sync request for (syncType, userWallet, secondaryEndpoint) can only be enqueued once
 * This is used to ensure multiple concurrent sync tasks are not being redundantly used on a single user
 * Implemented with an in-memory map of string(syncType, userWallet, secondaryEndpoint) -> object(syncJobProps)
 *
 * @dev We maintain this map to maximize query performance; Bull does not provide any api for querying
 *    jobs by property and would require a linear iteration over the full job list
 */
class SyncRequestDeDuplicator {
  /** Stringify properties to enable storage with a flat map */
  _getSyncKey(syncType, userWallet, secondaryEndpoint, immediate = false) {
    return `${syncType}::${userWallet}::${secondaryEndpoint}::${immediate}`
  }

  /**
   * Returns array of all keys in Redis matching pattern, using redis SCAN
   * https://github.com/luin/ioredis#streamify-scanning
   *
   * @returns array | Error
   */
  async _getAllKeys() {
    const stream = redisClient.scanStream({
      match: this._getPatternForAllKeys()
    })

    const keySet = new Set()
    return new Promise((resolve, reject) => {
      stream.on('data', (keys = []) => {
        keys.forEach((key) => {
          keySet.add(key)
        })
      })
      stream.on('end', () => {
        resolve(Array.from(keySet).filter(Boolean))
      })
      stream.on('error', (e) => {
        reject(e)
      })
    })
  }

  /**
   * Builds redis key pattern given params, using today as the default date
   * and wildcard matcher for every other default param.
   * Key pattern string can map to one or multiple keys.
   */
  _getPatternForAllKeys() {
    return `*::*::*::*`
  }

  async clear() {
    const keys = await this._getAllKeys()
    for (const key of keys) {
      await redisClient.del(key)
    }
  }

  /** Return job info of sync with given properties if present else null */
  async getDuplicateSyncJobInfo(
    syncType,
    userWallet,
    secondaryEndpoint,
    immediate = false
  ) {
    const syncKey = this._getSyncKey(
      syncType,
      userWallet,
      secondaryEndpoint,
      immediate
    )

    const duplicateSyncJobInfo = JSON.parse(
      (await redisClient.get(syncKey)) || '{}'
    )
    if (_.isEmpty(duplicateSyncJobInfo)) return null
    return duplicateSyncJobInfo
  }

  /** Record job info for sync with given properties */
  async recordSync(
    syncType,
    userWallet,
    secondaryEndpoint,
    immediate = false,
    jobProps
  ) {
    const syncKey = this._getSyncKey(
      syncType,
      userWallet,
      secondaryEndpoint,
      immediate
    )

    await redisClient.set(syncKey, JSON.stringify(jobProps))
  }

  /** Remove sync with given properties */
  async removeSync(syncType, userWallet, secondaryEndpoint, immediate = false) {
    const syncKey = this._getSyncKey(
      syncType,
      userWallet,
      secondaryEndpoint,
      immediate
    )

    await redisClient.del(syncKey)
  }
}

module.exports = new SyncRequestDeDuplicator()
