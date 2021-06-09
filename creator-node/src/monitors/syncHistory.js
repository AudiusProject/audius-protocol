const redisClient = require('../redis')
const SyncHistoryAggregator = require('../snapbackSM/syncHistoryAggregator')

const get30DayRollingSyncSuccessCount = async () => {
  // Get the start and end dates of the rolling window
  const today = new Date()
  const rollingWindowStartDate = new Date(
    today.setDate(today.getDate() - 30)
  )
  const rollingWindowEndDate = new Date()

  // Get the success count from the date within the rolling window range
  let rollingSyncSuccessCount = 0
  let date = rollingWindowStartDate

  while (date <= rollingWindowEndDate) { // eslint-disable-line no-unmodified-loop-condition
    const redisDateKeySuffix = date.toISOString().split('T')[0] // ex.: "2021-05-04"
    const { success: syncSuccessCountKey } = SyncHistoryAggregator.getAggregateSyncKeys(redisDateKeySuffix)

    const syncSuccessCount = await getSyncCount(syncSuccessCountKey)
    rollingSyncSuccessCount += syncSuccessCount

    // Set the date to the next day
    date.setDate(date.getDate() + 1)
  }

  return rollingSyncSuccessCount
}

const get30DayRollingSyncFailCount = async () => {
  // Get the start and end dates of the rolling window
  const today = new Date()
  const rollingWindowStartDate = new Date(
    today.setDate(today.getDate() - 30)
  )
  const rollingWindowEndDate = new Date()

  // Get the fail count from the date within the rolling window range
  let rollingSyncFailCount = 0
  let date = rollingWindowStartDate

  while (date <= rollingWindowEndDate) { // eslint-disable-line no-unmodified-loop-condition
    const redisDateKeySuffix = date.toISOString().split('T')[0] // ex.: "2021-05-04"
    const { fail: syncFailCountKey } = SyncHistoryAggregator.getAggregateSyncKeys(redisDateKeySuffix)

    const syncFailCount = await getSyncCount(syncFailCountKey)
    rollingSyncFailCount += syncFailCount

    // Set the date to the next day
    date.setDate(date.getDate() + 1)
  }

  return rollingSyncFailCount
}

const getDailySyncSuccessCount = async () => {
  const { success } = await SyncHistoryAggregator.getAggregateSyncData()
  return success
}

const getDailySyncFailCount = async () => {
  const { fail } = await SyncHistoryAggregator.getAggregateSyncData()
  return fail
}

const getLatestSyncSuccessTimestamp = async () => {
  const { success } = await SyncHistoryAggregator.getLatestSyncData()
  return success
}

const getLatestSyncFailTimestamp = async () => {
  const { fail } = await SyncHistoryAggregator.getLatestSyncData()
  return fail
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
  get30DayRollingSyncSuccessCount,
  get30DayRollingSyncFailCount,
  getDailySyncSuccessCount,
  getDailySyncFailCount,
  getLatestSyncSuccessTimestamp,
  getLatestSyncFailTimestamp
}
