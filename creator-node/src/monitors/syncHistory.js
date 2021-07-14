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
    const { success } = SyncHistoryAggregator.getPerWalletSyncData(redisDateKeySuffix, {})
    rollingSyncSuccessCount += success

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
    const { fail } = SyncHistoryAggregator.getPerWalletSyncData(redisDateKeySuffix, {})
    rollingSyncFailCount += fail

    // Set the date to the next day
    date.setDate(date.getDate() + 1)
  }

  return rollingSyncFailCount
}

const getDailySyncSuccessCount = async () => {
  const { success } = await SyncHistoryAggregator.getPerWalletSyncData()
  return success
}

const getDailySyncFailCount = async () => {
  const { fail } = await SyncHistoryAggregator.getPerWalletSyncData()
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
