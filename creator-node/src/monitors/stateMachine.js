const redis = require('../redis')

const {
  QUEUE_NAMES
} = require('../services/stateMachineManager/stateMachineConstants')

const get30DayRollingSyncSuccessCount = async () => {
  return 0
}

const get30DayRollingSyncFailCount = async () => {
  return 0
}

const getDailySyncSuccessCount = async () => {
  return 0
}

const getDailySyncFailCount = async () => {
  return 0
}

const getLatestSyncSuccessTimestamp = async () => {
  return new Date()
}

const getLatestSyncFailTimestamp = async () => {
  return new Date()
}

module.exports = {
  get30DayRollingSyncSuccessCount,
  get30DayRollingSyncFailCount,
  getDailySyncSuccessCount,
  getDailySyncFailCount,
  getLatestSyncSuccessTimestamp,
  getLatestSyncFailTimestamp
}
