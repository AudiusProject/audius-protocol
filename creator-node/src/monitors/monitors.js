const { getDatabaseSize, getDatabaseConnections, getDatabaseConnectionInfo, getDatabaseLiveness } = require('./database')
const { getTotalMemory, getUsedMemory } = require('./memory')
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
  getIPFSReadWriteStatus,
  getIPFSPinStatus
} = require('./ipfs')
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
 */

const DATABASE_LIVENESS = {
  name: 'databaseLiveness',
  func: getDatabaseLiveness
}
const DATABASE_SIZE = {
  name: 'databaseSize',
  func: getDatabaseSize,
  ttl: 60 * 2
}
const DATABASE_CONNECTIONS = {
  name: 'databaseConnections',
  func: getDatabaseConnections
}
const DATABASE_CONNECTION_INFO = {
  name: 'databaseConnectionInfo',
  func: getDatabaseConnectionInfo
}

const TOTAL_MEMORY = {
  name: 'totalMemory',
  func: getTotalMemory,
  ttl: 60 * 2
}
const USED_MEMORY = {
  name: 'usedMemory',
  func: getUsedMemory,
  ttl: 60 * 2
}

const STORAGE_PATH_SIZE = {
  name: 'storagePathSize',
  func: getStoragePathSize,
  ttl: 60 * 5
}
const STORAGE_PATH_USED = {
  name: 'storagePathUsed',
  func: getStoragePathUsed,
  ttl: 60 * 5
}
const FILESYSTEM_SIZE = {
  name: 'filesystemSize',
  func: getFilesystemSize,
  ttl: 60 * 5
}
const FILESYSTEM_USED = {
  name: 'filesystemUsed',
  func: getFilesystemUsed,
  ttl: 60 * 5
}
const MAX_FILE_DESCRIPTORS = {
  name: 'maxFileDescriptors',
  func: getMaxFileDescriptors,
  ttl: 60 * 5
}
const ALLOCATED_FILE_DESCRIPTORS = {
  name: 'allocatedFileDescriptors',
  func: getAllocatedFileDescriptors,
  ttl: 60 * 5
}

const RECEIVED_BYTES_PER_SEC = {
  name: 'receivedBytesPerSec',
  func: getReceivedBytesPerSec
}
const TRANSFERRED_BYTES_PER_SEC = {
  name: 'transferredBytesPerSec',
  func: getTransferredBytesPerSec
}

const REDIS_NUM_KEYS = {
  name: 'redisNumKeys',
  func: getRedisNumKeys,
  ttl: 60 * 5
}
const REDIS_USED_MEMORY = {
  name: 'redisUsedMemory',
  func: getRedisUsedMemory,
  ttl: 60 * 5
}
const REDIS_TOTAL_MEMORY = {
  name: 'redisTotalMemory',
  func: getRedisTotalMemory,
  ttl: 60 * 5
}

const IPFS_READ_WRITE_STATUS = {
  name: 'IPFSReadWriteStatus',
  func: getIPFSReadWriteStatus,
  ttl: 60 * 5
}
const IPFS_PIN_STATUS = {
  name: 'IPFSPinStatus',
  func: getIPFSPinStatus,
  ttl: 60 * 5
}

const MONITORS = {
  DATABASE_LIVENESS,
  DATABASE_SIZE,
  DATABASE_CONNECTIONS,
  DATABASE_CONNECTION_INFO,
  TOTAL_MEMORY,
  USED_MEMORY,
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
  IPFS_PIN_STATUS
}

const getMonitorRedisKey = (monitor) => `${MONITORING_REDIS_PREFIX}:${monitor.name}`

const getMonitor = async (monitor) => {
  const key = getMonitorRedisKey(monitor)
  return redis.get(key)
}

module.exports = {
  MONITORS,
  getMonitorRedisKey,
  getMonitor
}
