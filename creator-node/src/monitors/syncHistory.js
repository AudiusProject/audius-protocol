const redisClient = require('../redis')
const SyncHistoryAggregator = require('../snapbackSM/syncHistoryAggregator')

// The window to determine the aggregate sync history count
const ROLLING_WINDOW = 30 // days

const getRollingSyncSuccessCount = async () => {
  // Get the start and end dates of the rolling window
  const today = new Date()
  const rollingWindowStartDate = new Date(
    today.setDate(today.getDate() - ROLLING_WINDOW)
  )
  const rollingWindowEndDate = new Date()

  // Get the success count from the date within the rolling window range
  let rollingSyncSuccessCount = 0
  let date = rollingWindowStartDate

  while (date <= rollingWindowEndDate) {
    const redisDateKeySuffix = date.toISOString().split('T')[0] // ex.: "2021-05-04"
    const { success: syncSuccessCountKey } = SyncHistoryAggregator.getAggregateSyncKeys(redisDateKeySuffix)

    const syncSuccessCount = await getSyncCount(syncSuccessCountKey)
    rollingSyncSuccessCount += syncSuccessCount

    // Set the date to the next day
    date.setDate(date.getDate() + 1)
  }

  return rollingSyncSuccessCount
}

const getRollingSyncFailCount = async () => {
  // Get the start and end dates of the rolling window
  const today = new Date()
  const rollingWindowStartDate = new Date(
    today.setDate(today.getDate() - ROLLING_WINDOW)
  )
  const rollingWindowEndDate = new Date()

  // Get the fail count from the date within the rolling window range
  let rollingSyncFailCount = 0
  let date = rollingWindowStartDate

  while (date <= rollingWindowEndDate) {
    const redisDateKeySuffix = date.toISOString().split('T')[0] // ex.: "2021-05-04"
    const { fail: syncFailCountKey } = SyncHistoryAggregator.getAggregateSyncKeys(redisDateKeySuffix)

    const syncFailCount = await getSyncCount(syncFailCountKey)
    rollingSyncFailCount += syncFailCount

    // Set the date to the next day
    date.setDate(date.getDate() + 1)
  }

  return rollingSyncFailCount
}

/**
 * Get sync count given key param
 * @param {string} key redis key for sync success or fail count
 * @returns the number of successful or failed sync attempts or 0
 */
const getSyncCount = async key => {
  let syncCount = await redisClient.get(key)
  return parseInt(syncCount) || 0
}

module.exports = {
  getRollingSyncSuccessCount,
  getRollingSyncFailCount,
  ROLLING_WINDOW
}
