const versionInfo = require('../../../.version.json')
const config = require('../../config')
const utils = require('../../utils.js')
const { MONITORS } = require('../../monitors/monitors')

const MIN_NUBMER_OF_CPUS = 8 // 8 cpu
const MIN_TOTAL_MEMORY = 15500000000 // 15.5 GB of RAM
const MIN_FILESYSTEM_SIZE = 1950000000000 // 1950 GB of file system storage

/**
 * Perform a basic health check, returning the
 * currently selected discovery provider (if any),
 * the current git SHA, and service version info.
 * @param {*} ServiceRegistry
 * @param {*} logger
 * @param {*} sequelize
 * @param {*} getMonitors
 * @param {number} numberOfCPUs the number of CPUs on this machine
 * @param {string?} randomBytesToSign optional bytes string to be included in response object
 *    and used in signature generation
 */
const healthCheck = async ({ libs } = {}, logger, sequelize, getMonitors, numberOfCPUs, randomBytesToSign = null) => {
  // System information
  const [
    totalMemory,
    storagePathSize
  ] = await getMonitors([
    MONITORS.TOTAL_MEMORY,
    MONITORS.STORAGE_PATH_SIZE
  ])

  let response = {
    ...versionInfo,
    healthy: true,
    git: process.env.GIT_SHA,
    selectedDiscoveryProvider: 'none',
    creatorNodeEndpoint: config.get('creatorNodeEndpoint'),
    spID: config.get('spID'),
    spOwnerWallet: config.get('spOwnerWallet'),
    isRegisteredOnURSM: config.get('isRegisteredOnURSM'),
    numberOfCPUs,
    totalMemory,
    storagePathSize
  }

  // If optional `randomBytesToSign` query param provided, node will include string in signed object
  if (randomBytesToSign) {
    response.randomBytesToSign = randomBytesToSign
  }

  if (libs) {
    response.selectedDiscoveryProvider = libs.discoveryProvider.discoveryProviderEndpoint
  } else {
    logger.warn('Health check with no libs')
  }

  // we have a /db_check route for more granular detail, but the service health check should
  // also check that the db connection is good. having this in the health_check
  // allows us to get auto restarts from liveness probes etc if the db connection is down
  await sequelize.query('SELECT 1')

  if (
    !response['numberOfCPUs'] || response['numberOfCPUs'] < MIN_NUBMER_OF_CPUS ||
    !response['totalMemory'] || response['totalMemory'] < MIN_TOTAL_MEMORY ||
    !response['storagePathSize'] || response['storagePathSize'] < MIN_FILESYSTEM_SIZE
  ) {
    response['meetsMinRequirements'] = false
  } else {
    response['meetsMinRequirements'] = true
  }

  return response
}

/**
 * Perform a verbose health check, returning health check results
 * as well as location info, and system info.
 * @param {*} ServiceRegistry
 * @param {*} logger
 * @param {*} sequelize
 * @param {*} getMonitors
 * @param {number} numberOfCPUs the number of CPUs on this machine
 * @param {function} getAggregateSyncData fn to get the latest daily sync count (success, fail, triggered)
 * @param {function} getLatestSyncData fn to get the timestamps of the most recent sync (success, fail)
 */
const healthCheckVerbose = async ({ libs, snapbackSM } = {}, logger, sequelize, getMonitors, numberOfCPUs, getAggregateSyncData, getLatestSyncData) => {
  const basicHealthCheck = await healthCheck({ libs }, logger, sequelize, getMonitors, numberOfCPUs)

  // Location information
  const country = config.get('serviceCountry')
  const latitude = config.get('serviceLatitude')
  const longitude = config.get('serviceLongitude')

  // Storage information
  const maxStorageUsedPercent = config.get('maxStorageUsedPercent')

  // SnapbackSM information
  const snapbackJobInterval = config.get('snapbackJobInterval')
  const snapbackModuloBase = config.get('snapbackModuloBase')
  const manualSyncsDisabled = config.get('manualSyncsDisabled')

  // System information
  const [
    databaseConnections,
    databaseSize,
    totalMemory,
    usedMemory,
    usedTCPMemory,
    storagePathSize,
    storagePathUsed,
    maxFileDescriptors,
    allocatedFileDescriptors,
    receivedBytesPerSec,
    transferredBytesPerSec,
    thirtyDayRollingSyncSuccessCount,
    thirtyDayRollingSyncFailCount,
    dailySyncSuccessCount,
    dailySyncFailCount,
    latestSyncSuccessTimestamp,
    latestSyncFailTimestamp
  ] = await getMonitors([
    MONITORS.DATABASE_CONNECTIONS,
    MONITORS.DATABASE_SIZE,
    MONITORS.TOTAL_MEMORY,
    MONITORS.USED_MEMORY,
    MONITORS.USED_TCP_MEMORY,
    MONITORS.STORAGE_PATH_SIZE,
    MONITORS.STORAGE_PATH_USED,
    MONITORS.MAX_FILE_DESCRIPTORS,
    MONITORS.ALLOCATED_FILE_DESCRIPTORS,
    MONITORS.RECEIVED_BYTES_PER_SEC,
    MONITORS.TRANSFERRED_BYTES_PER_SEC,
    MONITORS.THIRTY_DAY_ROLLING_SYNC_SUCCESS_COUNT,
    MONITORS.THIRTY_DAY_ROLLING_SYNC_FAIL_COUNT,
    MONITORS.DAILY_SYNC_SUCCESS_COUNT,
    MONITORS.DAILY_SYNC_FAIL_COUNT,
    MONITORS.LATEST_SYNC_SUCCESS_TIMESTAMP,
    MONITORS.LATEST_SYNC_FAIL_TIMESTAMP
  ])

  let currentSnapbackReconfigMode
  if (snapbackSM) {
    currentSnapbackReconfigMode = snapbackSM.highestEnabledReconfigMode
  }

  const response = {
    ...basicHealthCheck,
    country,
    latitude,
    longitude,
    databaseConnections,
    databaseSize,
    totalMemory,
    usedMemory,
    usedTCPMemory,
    storagePathSize,
    storagePathUsed,
    maxFileDescriptors,
    allocatedFileDescriptors,
    receivedBytesPerSec,
    transferredBytesPerSec,
    maxStorageUsedPercent,
    numberOfCPUs,
    // Rolling window days dependent on value set in monitor's sync history file
    thirtyDayRollingSyncSuccessCount,
    thirtyDayRollingSyncFailCount,
    dailySyncSuccessCount,
    dailySyncFailCount,
    latestSyncSuccessTimestamp,
    latestSyncFailTimestamp,
    currentSnapbackReconfigMode,
    manualSyncsDisabled,
    snapbackModuloBase,
    snapbackJobInterval
  }

  return response
}

/**
 * Perform a duration health check limited to configured delegateOwnerWallet
 * Used to validate availability prior to joining the network
 * @param {*} ServiceRegistry
 * @param {*} logger
 */
const healthCheckDuration = async () => {
  // Wait 5 minutes, intentionally holding this route open
  await utils.timeout(300000)
  return { success: true }
}

module.exports = {
  healthCheck,
  healthCheckVerbose,
  healthCheckDuration
}
