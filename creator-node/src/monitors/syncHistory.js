const SyncHistoryAggregator = require('../snapbackSM/syncHistoryAggregator')
const { SYNC_STATES } = require('../snapbackSM/syncHistoryAggregator')

/**
 * Get the total number of syncs that met 'status' per wallet per day for the given number of days
 * @param {String} status Valid state from SYNC_STATES
 * @param {Number} days number of historical days to get data for
 * @returns {Number} number of syncs per wallet per day that met the status
 */
const _getRollingSyncCount = async (status, days) => {
  if (status !== SYNC_STATES.success && status !== SYNC_STATES.fail) throw new Error('Invalid status for _getRollingSyncCount: must be valid state from SYNC_STATES')

  // Get the start and end dates of the rolling window
  const today = new Date()
  const rollingWindowStartDate = new Date(
    today.setDate(today.getDate() - days)
  )
  const rollingWindowEndDate = new Date()

  // Get the count for this status from the date within the rolling window range
  let rollingSyncStatusCount = 0
  let date = rollingWindowStartDate

  while (date <= rollingWindowEndDate) { // eslint-disable-line no-unmodified-loop-condition
    const redisDateKeySuffix = date.toISOString().split('T')[0] // ex.: "2021-05-04"
    const resp = await SyncHistoryAggregator.getDailyWalletSyncData(redisDateKeySuffix)
    rollingSyncStatusCount += parseInt(resp[status], 10) || 0

    // Set the date to the next day
    date.setDate(date.getDate() + 1)
  }

  return rollingSyncStatusCount
}

const get30DayRollingSyncSuccessCount = async () => {
  return _getRollingSyncCount(SYNC_STATES.success, 30)
}

const get30DayRollingSyncFailCount = async () => {
  return _getRollingSyncCount(SYNC_STATES.fail, 30)
}

const getDailySyncSuccessCount = async () => {
  const { success } = await SyncHistoryAggregator.getDailyWalletSyncData()
  return success
}

const getDailySyncFailCount = async () => {
  const { fail } = await SyncHistoryAggregator.getDailyWalletSyncData()
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

module.exports = {
  get30DayRollingSyncSuccessCount,
  get30DayRollingSyncFailCount,
  getDailySyncSuccessCount,
  getDailySyncFailCount,
  getLatestSyncSuccessTimestamp,
  getLatestSyncFailTimestamp
}
