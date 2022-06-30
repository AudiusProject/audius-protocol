const path = require('path')
const versionInfo = require(path.join(process.cwd(), '.version.json'))
const { Keypair } = require('@solana/web3.js')

const config = require('../../config')
const utils = require('../../utils.js')
const { MONITORS } = require('../../monitors/monitors')

const MIN_NUBMER_OF_CPUS = 8 // 8 cpu
const MIN_TOTAL_MEMORY = 15500000000 // 15.5 GB of RAM
const MIN_FILESYSTEM_SIZE = 1950000000000 // 1950 GB of file system storage

/**
 * Perform a health check, returning the
 * currently selected discovery provider (if any),
 * the current git SHA, service version info, location info, and system info.
 * @param {*} ServiceRegistry
 * @param {*} logger
 * @param {*} sequelize
 * @param {*} getMonitors
 * @param {*} getTranscodeQueueJobs
 * @param {*} getAsyncProcessingQueueJobs
 * @param {number} numberOfCPUs the number of CPUs on this machine
 * @param {string?} randomBytesToSign optional bytes string to be included in response object
 *    and used in signature generation
 */
const healthCheck = async (
  { libs, snapbackSM } = {},
  logger,
  sequelize,
  getMonitors,
  getTranscodeQueueJobs,
  transcodingQueueIsAvailable,
  getAsyncProcessingQueueJobs,
  numberOfCPUs,
  randomBytesToSign = null
) => {
  // Location information
  const country = config.get('serviceCountry')
  const latitude = config.get('serviceLatitude')
  const longitude = config.get('serviceLongitude')

  // Storage information
  const maxStorageUsedPercent = config.get('maxStorageUsedPercent')

  // SnapbackSM information
  const snapbackUsersPerJob = config.get('snapbackUsersPerJob')
  const snapbackModuloBase = config.get('snapbackModuloBase')
  const manualSyncsDisabled = config.get('manualSyncsDisabled')

  // expose audiusInfraStack to see how node is being run
  const audiusContentInfraSetup = config.get('audiusContentInfraSetup')

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
    latestSyncFailTimestamp,
    stateMachineQueueLatestJobSuccess,
    stateMachineQueueLatestJobStart
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
    MONITORS.LATEST_SYNC_FAIL_TIMESTAMP,
    MONITORS.LATEST_STATE_MACHINE_QUEUE_SUCCESS,
    MONITORS.LATEST_STATE_MACHINE_QUEUE_START
  ])

  let currentSnapbackReconfigMode
  if (snapbackSM) {
    currentSnapbackReconfigMode = snapbackSM.highestEnabledReconfigMode
  }

  const { active: transcodeActive, waiting: transcodeWaiting } =
    await getTranscodeQueueJobs()

  const asyncProcessingQueueJobs = await getAsyncProcessingQueueJobs()

  const isAvailable = await transcodingQueueIsAvailable()
  const shouldHandleTranscode = utils.currentNodeShouldHandleTranscode({
    transcodingQueueCanAcceptMoreJobs: isAvailable,
    spID: config.get('spID')
  })

  let solDelegatePublicKeyBase58 = ''
  try {
    const solDelegatePrivateKey = config.get('solDelegatePrivateKeyBase64')
    const solDelegatePrivateKeyBuffer = new Uint8Array(
      Buffer.from(solDelegatePrivateKey, 'base64')
    )
    const solDelegateKeyPair = Keypair.fromSecretKey(
      solDelegatePrivateKeyBuffer
    )
    solDelegatePublicKeyBase58 = solDelegateKeyPair.publicKey.toBase58()
  } catch (_) {}

  const response = {
    ...versionInfo,
    healthy: true,
    git: process.env.GIT_SHA,
    selectedDiscoveryProvider: 'none',
    creatorNodeEndpoint: config.get('creatorNodeEndpoint'),
    spID: config.get('spID'),
    spOwnerWallet: config.get('spOwnerWallet'),
    isRegisteredOnURSM: config.get('isRegisteredOnURSM'),
    dataProviderUrl: config.get('dataProviderUrl'),
    audiusContentInfraSetup,
    numberOfCPUs,
    totalMemory,
    storagePathSize,
    country,
    latitude,
    longitude,
    databaseConnections,
    databaseSize,
    usedMemory,
    usedTCPMemory,
    storagePathUsed,
    maxFileDescriptors,
    allocatedFileDescriptors,
    receivedBytesPerSec,
    transferredBytesPerSec,
    maxStorageUsedPercent,
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
    snapbackUsersPerJob,
    stateMonitoringQueueRateLimitInterval: config.get(
      'stateMonitoringQueueRateLimitInterval'
    ),
    stateMonitoringQueueRateLimitJobsPerInterval: config.get(
      'stateMonitoringQueueRateLimitJobsPerInterval'
    ),
    transcodeActive,
    transcodeWaiting,
    transcodeQueueIsAvailable: isAvailable,
    shouldHandleTranscode,
    asyncProcessingQueue: asyncProcessingQueueJobs,
    solDelegatePublicKeyBase58,
    stateMachineQueueLatestJobSuccess: stateMachineQueueLatestJobSuccess
      ? new Date(parseInt(stateMachineQueueLatestJobSuccess)).toISOString()
      : null,
    stateMachineQueueLatestJobStart: stateMachineQueueLatestJobStart
      ? new Date(parseInt(stateMachineQueueLatestJobStart)).toISOString()
      : null
  }

  // If optional `randomBytesToSign` query param provided, node will include string in signed object
  if (randomBytesToSign) {
    response.randomBytesToSign = randomBytesToSign
  }

  if (libs) {
    response.selectedDiscoveryProvider =
      libs.discoveryProvider.discoveryProviderEndpoint
  } else {
    logger.warn('Health check with no libs')
  }

  if (
    !response.numberOfCPUs ||
    response.numberOfCPUs < MIN_NUBMER_OF_CPUS ||
    !response.totalMemory ||
    response.totalMemory < MIN_TOTAL_MEMORY ||
    !response.storagePathSize ||
    response.storagePathSize < MIN_FILESYSTEM_SIZE
  ) {
    response.meetsMinRequirements = false
  } else {
    response.meetsMinRequirements = true
  }

  return response
}

// TODO remove verbose health check after fully deprecated
const healthCheckVerbose = async (
  { libs, snapbackSM } = {},
  logger,
  sequelize,
  getMonitors,
  numberOfCPUs,
  getTranscodeQueueJobs,
  transcodingQueueIsAvailable,
  getAsyncProcessingQueueJobs
) => {
  return healthCheck(
    { libs, snapbackSM },
    logger,
    sequelize,
    getMonitors,
    getTranscodeQueueJobs,
    transcodingQueueIsAvailable,
    getAsyncProcessingQueueJobs,
    numberOfCPUs
  )
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
