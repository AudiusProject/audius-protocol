const versionInfo = require('../../../.version.json')
const config = require('../../config')
const utils = require('../../utils.js')
const {
  getMonitor: getMonitorValue,
  MONITORS
} = require('../../monitors/monitors')

/**
 * Perform a basic health check, returning the
 * currently selected discovery provider (if any),
 * the current git SHA, and service version info.
 * @param {*} ServiceRegistry
 * @param {*} logger
 */
const healthCheck = async ({ libs } = {}, logger, getMonitor = getMonitorValue) => {
  let response = {
    ...versionInfo,
    healthy: true,
    git: process.env.GIT_SHA,
    selectedDiscoveryProvider: 'none',
    creatorNodeEndpoint: config.get('creatorNodeEndpoint'),
    spID: config.get('spID'),
    spOwnerWallet: config.get('spOwnerWallet')
  }

  if (libs) {
    response.selectedDiscoveryProvider = libs.discoveryProvider.discoveryProviderEndpoint
  } else {
    logger.warn('Health check with no libs')
  }

  // we have a /db_check route for more granular detail, but the service health check should
  // also check that the db connection is good. having this in the health_check
  // allows us to get auto restarts from liveness probes etc if the db connection is down
  const databaseLiveness = await getMonitor(MONITORS.DATABASE_LIVENESS) === 'true'
  if (!databaseLiveness) throw new Error('Database connection failed')

  return response
}

/**
 * Perform a verbose health check, returning health check results
 * as well as location info, and system info.
 * @param {*} ServiceRegistry
 * @param {*} logger
 */
const healthCheckVerbose = async ({ libs } = {}, logger, getMonitor = getMonitorValue) => {
  const basicHealthCheck = await healthCheck({ libs }, logger, getMonitor)

  // Location information
  const country = config.get('serviceCountry')
  const latitude = config.get('serviceLatitude')
  const longitude = config.get('serviceLongitude')

  // System information
  const databaseConnections = parseInt(await getMonitor(MONITORS.DATABASE_CONNECTIONS))
  const totalMemory = parseInt(await getMonitor(MONITORS.TOTAL_MEMORY))
  const usedMemory = parseInt(await getMonitor(MONITORS.USED_MEMORY))
  const storagePathSize = parseInt(await getMonitor(MONITORS.STORAGE_PATH_SIZE))
  const storagePathUsed = parseInt(await getMonitor(MONITORS.STORAGE_PATH_USED))
  const maxFileDescriptors = parseInt(await getMonitor(MONITORS.MAX_FILE_DESCRIPTORS))
  const allocatedFileDescriptors = parseInt(await getMonitor(MONITORS.ALLOCATED_FILE_DESCRIPTORS))
  const receivedBytesPerSec = parseFloat(await getMonitor(MONITORS.RECEIVED_BYTES_PER_SEC))
  const transferredBytesPerSec = parseFloat(await getMonitor(MONITORS.TRANSFERRED_BYTES_PER_SEC))

  const response = {
    ...basicHealthCheck,
    country,
    latitude,
    longitude,
    databaseConnections,
    totalMemory,
    usedMemory,
    storagePathSize,
    storagePathUsed,
    maxFileDescriptors,
    allocatedFileDescriptors,
    receivedBytesPerSec,
    transferredBytesPerSec
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
