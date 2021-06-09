const { getDatabaseSize, getDatabaseConnections, getDatabaseConnectionInfo, getDatabaseLiveness } = require('./database')
const {
  getTotalMemory,
  getUsedMemory,
  getNodeProcessMemoryUsage,
  getUsedTCPMemory
} = require('./memory')
const {
  getStoragePathSize,
  getStoragePathUsed,
  getFilesystemSize,
  getFilesystemUsed,
  getMaxFileDescriptors,
  getAllocatedFileDescriptors
} = require('./filesystem')
const {
  getReceivedBytesPerSec,
  getTransferredBytesPerSec
} = require('./network')
const {
  getRedisNumKeys,
  getRedisUsedMemory,
  getRedisTotalMemory
} = require('./redis')
const {
  getIPFSReadWriteStatus
} = require('./ipfs')
const {
  get30DayRollingSyncSuccessCount,
  get30DayRollingSyncFailCount,
  getDailySyncSuccessCount,
  getDailySyncFailCount,
  getLatestSyncSuccessTimestamp,
  getLatestSyncFailTimestamp
} = require('./syncHistory')
const redis = require('../redis')

// Prefix used to key each monitored value in redis
const MONITORING_REDIS_PREFIX = 'monitoring'

/**
 * List of all monitors to run, containing:
 *  @param {string} name A unique name for the metric (for caching in redis)
 *  @param {function} func The actual work to compute a value. The return value is what is cached.
 *  @param {number?} ttl TTL in seconds for how long a cached value is good for.
 *    Since the job runs on a cron, the min TTL a metric can be refreshed is 60s.
 *    If a TTL isn't provided, the metric is refreshed every 60s.
 *  @param {string?} type Optional type that the value should be parsed to (default is string)
 *    Options are bool, int, float, string, json
 */

const DATABASE_LIVENESS = {
  name: 'databaseLiveness',
  func: getDatabaseLiveness,
  type: 'bool'
}
const DATABASE_SIZE = {
  name: 'databaseSize',
  func: getDatabaseSize,
  ttl: 60 * 2,
  type: 'int'
}
const DATABASE_CONNECTIONS = {
  name: 'databaseConnections',
  func: getDatabaseConnections,
  type: 'int'
}
const DATABASE_CONNECTION_INFO = {
  name: 'databaseConnectionInfo',
  func: getDatabaseConnectionInfo,
  type: 'json'
}

const TOTAL_MEMORY = {
  name: 'totalMemory',
  func: getTotalMemory,
  type: 'int'
}
const USED_MEMORY = {
  name: 'usedMemory',
  func: getUsedMemory,
  type: 'int'
}
const NODE_PROCESS_MEMORY_USAGE = {
  name: 'nodeProcessMemoryUsage',
  func: getNodeProcessMemoryUsage,
  type: 'json'
}

const USED_TCP_MEMORY = {
  name: 'usedTCPMemory',
  func: getUsedTCPMemory,
  type: 'int'
}

const STORAGE_PATH_SIZE = {
  name: 'storagePathSize',
  func: getStoragePathSize,
  ttl: 60 * 5,
  type: 'int'
}
const STORAGE_PATH_USED = {
  name: 'storagePathUsed',
  func: getStoragePathUsed,
  ttl: 60 * 5,
  type: 'int'
}
const FILESYSTEM_SIZE = {
  name: 'filesystemSize',
  func: getFilesystemSize,
  ttl: 60 * 5,
  type: 'int'
}
const FILESYSTEM_USED = {
  name: 'filesystemUsed',
  func: getFilesystemUsed,
  ttl: 60 * 5,
  type: 'int'
}
const MAX_FILE_DESCRIPTORS = {
  name: 'maxFileDescriptors',
  func: getMaxFileDescriptors,
  ttl: 60 * 5,
  type: 'int'
}
const ALLOCATED_FILE_DESCRIPTORS = {
  name: 'allocatedFileDescriptors',
  func: getAllocatedFileDescriptors,
  ttl: 60 * 5,
  type: 'int'
}

const RECEIVED_BYTES_PER_SEC = {
  name: 'receivedBytesPerSec',
  func: getReceivedBytesPerSec,
  type: 'float'
}
const TRANSFERRED_BYTES_PER_SEC = {
  name: 'transferredBytesPerSec',
  func: getTransferredBytesPerSec,
  type: 'float'
}

const REDIS_NUM_KEYS = {
  name: 'redisNumKeys',
  func: getRedisNumKeys,
  ttl: 60 * 5,
  type: 'int'
}
const REDIS_USED_MEMORY = {
  name: 'redisUsedMemory',
  func: getRedisUsedMemory,
  ttl: 60 * 5,
  type: 'int'
}
const REDIS_TOTAL_MEMORY = {
  name: 'redisTotalMemory',
  func: getRedisTotalMemory,
  ttl: 60 * 5,
  type: 'int'
}

const IPFS_READ_WRITE_STATUS = {
  name: 'IPFSReadWriteStatus',
  func: getIPFSReadWriteStatus,
  ttl: 60 * 5,
  type: 'json'
}

// The rolling window count of successful syncs
// The window is for 30 days
// Keep the rolling window count ttl to 1 hour (refreshes every hour)
const THIRTY_DAY_ROLLING_SYNC_SUCCESS_COUNT = {
  name: 'rollingSyncSuccessCount',
  func: get30DayRollingSyncSuccessCount,
  ttl: 60 /* mins */ * 60 /* s */,
  type: 'int'
}

// The rolling window count of failed syncs
// The window is for 30 days
// Keep the rolling window count ttl to 1 hour (refreshes every hour)
const THIRTY_DAY_ROLLING_SYNC_FAIL_COUNT = {
  name: 'rollingSyncFailCount',
  func: get30DayRollingSyncFailCount,
  ttl: 60 /* mins */ * 60 /* s */,
  type: 'int'
}

// The daily count of successful syncs
// Set ttl to every 5 minutes
const DAILY_SYNC_SUCCESS_COUNT = {
  name: 'dailySyncSuccessCount',
  func: getDailySyncSuccessCount,
  ttl: 5 /* mins */ * 60 /* s */,
  type: 'int'
}

// The daily count of successful syncs
// Set ttl freshness to every 5 minutes
const DAILY_SYNC_FAIL_COUNT = {
  name: 'dailySyncFailCount',
  func: getDailySyncFailCount,
  ttl: 5 /* mins */ * 60 /* s */,
  type: 'int'
}

// The timestamp of the latest succesful sync
// Set ttl freshness to every 5 minutes
const LATEST_SYNC_SUCCESS_TIMESTAMP = {
  name: 'latestSyncSuccessTimestamp',
  func: getLatestSyncSuccessTimestamp,
  ttl: 5 /* mins */ * 60 /* s */,
  type: 'string'
}

// The timestamp of the latest failed sync
// Set ttl freshness to every 5 minutes
const LATEST_SYNC_FAIL_TIMESTAMP = {
  name: 'latestSyncFailTimestamp',
  func: getLatestSyncFailTimestamp,
  ttl: 5 /* mins */ * 60 /* s */,
  type: 'string'
}

const MONITORS = {
  DATABASE_LIVENESS,
  DATABASE_SIZE,
  DATABASE_CONNECTIONS,
  DATABASE_CONNECTION_INFO,
  TOTAL_MEMORY,
  USED_MEMORY,
  NODE_PROCESS_MEMORY_USAGE,
  USED_TCP_MEMORY,
  STORAGE_PATH_SIZE,
  STORAGE_PATH_USED,
  FILESYSTEM_SIZE,
  FILESYSTEM_USED,
  MAX_FILE_DESCRIPTORS,
  ALLOCATED_FILE_DESCRIPTORS,
  RECEIVED_BYTES_PER_SEC,
  TRANSFERRED_BYTES_PER_SEC,
  REDIS_NUM_KEYS,
  REDIS_USED_MEMORY,
  REDIS_TOTAL_MEMORY,
  IPFS_READ_WRITE_STATUS,
  THIRTY_DAY_ROLLING_SYNC_SUCCESS_COUNT,
  THIRTY_DAY_ROLLING_SYNC_FAIL_COUNT,
  DAILY_SYNC_SUCCESS_COUNT,
  DAILY_SYNC_FAIL_COUNT,
  LATEST_SYNC_SUCCESS_TIMESTAMP,
  LATEST_SYNC_FAIL_TIMESTAMP
}

const getMonitorRedisKey = (monitor) => `${MONITORING_REDIS_PREFIX}:${monitor.name}`

/**
 * Parses a string value into the corresponding type
 * @param {Object} monitor
 * @param {string} value
 */
const parseValue = (monitor, value) => {
  try {
    if (monitor.type) {
      switch (monitor.type) {
        case 'bool':
          return value === 'true'
        case 'int':
          return parseInt(value)
        case 'float':
          return parseFloat(value)
        case 'json':
          return JSON.parse(value)
        case 'string':
          return value
        default:
          return value
      }
    }
    return value
  } catch (e) {
    return value
  }
}

/**
 * Gets monitor values
 * @param {Array<Object>} monitors the monitor, containing name, func, ttl, and type
 */
const getMonitors = async (monitors) => {
  const pipeline = redis.pipeline()
  monitors.forEach(monitor => {
    const key = getMonitorRedisKey(monitor)
    pipeline.get(key)
  })
  return pipeline
    .exec()
    // Pull the value off of the result
    .then((result) => result.map((r, i) => parseValue(monitors[i], r[1])))
}

module.exports = {
  MONITORS,
  getMonitorRedisKey,
  getMonitors
}
