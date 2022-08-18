const assert = require('assert')
const { Keypair } = require('@solana/web3.js')

const {
  healthCheck,
  healthCheckVerbose
} = require('./healthCheckComponentService')
const version = require('../../../.version.json')
const config = require('../../../src/config')
const { MONITORS } = require('../../monitors/monitors')

const TEST_ENDPOINT = 'test_endpoint'

// Secp256k1 private key (delegatePrivateKey env var is set to this when tests are run)
const ETH_PRIV_KEY =
  '0xdb527e4d4a2412a443c17e1666764d3bba43e89e61129a35f9abc337ec170a5d'

// Ed25519 private key (base64 encoded) when ETH_PRIV_KEY is the seed
const SOL_SECRET_KEY_BASE64 =
  '21J+TUokEqRDwX4WZnZNO7pD6J5hEpo1+avDN+wXCl3kGVNVzgvgquSQo60wNfF0ISQcb3CE+DjEgyMrbmGhpg=='

// Ed25519 private key (Buffer form) when ETH_PRIV_KEY is the seed
const SOL_SECRET_KEY_BUFFER = Buffer.from(SOL_SECRET_KEY_BASE64, 'base64')

// Ed25519 public key (base58 encoded) when ETH_PRIV_KEY is the seed
const SOL_PUBLIC_KEY_BASE58 = 'GMQMUsxnCKjnDVKG9UfYtQdkLVxDsHyZ9z3sLtLS6Unq'

const stateMachineManagerMock = {
  highestEnabledReconfigMode: 'RECONFIG_DISABLED'
}

const libsMock = {
  discoveryProvider: {
    discoveryProviderEndpoint: TEST_ENDPOINT
  }
}

const trustedNotifierManagerMock = {
  getTrustedNotifierData: () => {
    return {
      email: 'trusted@notifier.com',
      wallet: '0x73EB6d82CFB20bA669e9c178b718d770C49AAAAA',
      endpoint: 'default.trustednotifier'
    }
  },
  trustedNotifierID: 12
}

const sequelizeMock = {
  query: async () => Promise.resolve()
}

const getMonitorsMock = async (monitors) => {
  return monitors.map((monitor) => {
    switch (monitor.name) {
      case MONITORS.DATABASE_LIVENESS.name:
        return true
      case MONITORS.DATABASE_CONNECTIONS.name:
        return 5
      case MONITORS.DATABASE_SIZE.name:
        return 1102901
      case MONITORS.TOTAL_MEMORY.name:
        return 6237151232
      case MONITORS.USED_MEMORY.name:
        return 5969739776
      case MONITORS.USED_TCP_MEMORY.name:
        return 922
      case MONITORS.STORAGE_PATH_SIZE.name:
        return 62725623808
      case MONITORS.STORAGE_PATH_USED.name:
        return 54063878144
      case MONITORS.MAX_FILE_DESCRIPTORS.name:
        return 524288
      case MONITORS.ALLOCATED_FILE_DESCRIPTORS.name:
        return 3392
      case MONITORS.RECEIVED_BYTES_PER_SEC.name:
        return 776.7638177541248
      case MONITORS.TRANSFERRED_BYTES_PER_SEC.name:
        return 269500
      case MONITORS.THIRTY_DAY_ROLLING_SYNC_SUCCESS_COUNT.name:
        return 50
      case MONITORS.THIRTY_DAY_ROLLING_SYNC_FAIL_COUNT.name:
        return 10
      case MONITORS.DAILY_SYNC_SUCCESS_COUNT.name:
        return 5
      case MONITORS.DAILY_SYNC_FAIL_COUNT.name:
        return 0
      case MONITORS.LATEST_SYNC_SUCCESS_TIMESTAMP.name:
        return '2021-06-08T21:29:34.231Z'
      case MONITORS.LATEST_SYNC_FAIL_TIMESTAMP.name:
        return ''
      default:
        return null
    }
  })
}

const mockLogger = {
  warn: () => {}
}

const TranscodingQueueMock = (active = 0, waiting = 0) => {
  return {
    getTranscodeQueueJobs: async () => {
      return { active, waiting }
    },
    isAvailable: async () => {
      return true
    }
  }
}

const AsyncProcessingQueueMock = (active = 0, waiting = 0, failed = 0) => {
  return {
    getAsyncProcessingQueueJobs: async () => {
      return {
        waiting: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: waiting
        },
        active: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: active
        },
        failed: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: failed
        }
      }
    }
  }
}

describe('Test Health Check', function () {
  it('Should pass', async function () {
    config.set('serviceCountry', 'US')
    config.set('serviceLatitude', '37.7749')
    config.set('serviceLongitude', '-122.4194')
    config.set('maxStorageUsedPercent', 95)
    config.set('snapbackUsersPerJob', 2)
    config.set('stateMonitoringQueueRateLimitInterval', 20_000)
    config.set('stateMonitoringQueueRateLimitJobsPerInterval', 2)
    config.set('recoverOrphanedDataQueueRateLimitInterval', 50_000)
    config.set('recoverOrphanedDataQueueRateLimitJobsPerInterval', 1)
    config.set('snapbackModuloBase', 18)
    config.set('manualSyncsDisabled', false)
    config.set('solDelegatePrivateKeyBase64', SOL_SECRET_KEY_BASE64)

    config.set('creatorNodeEndpoint', 'http://test.endpoint')
    config.set('spID', 10)
    config.set('dataProviderUrl', 'http://test.dataProviderUrl')

    const res = await healthCheck(
      {
        libs: libsMock,
        stateMachineManager: stateMachineManagerMock,
        asyncProcessingQueue: AsyncProcessingQueueMock(0, 2),
        trustedNotifierManager: trustedNotifierManagerMock
      },
      mockLogger,
      sequelizeMock,
      getMonitorsMock,
      TranscodingQueueMock(4, 0).getTranscodeQueueJobs,
      TranscodingQueueMock(4, 0).isAvailable,
      AsyncProcessingQueueMock(0, 2).getAsyncProcessingQueueJobs,
      2
    )

    assert.deepStrictEqual(res, {
      ...version,
      service: 'content-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: TEST_ENDPOINT,
      spID: config.get('spID'),
      spOwnerWallet: config.get('spOwnerWallet'),
      creatorNodeEndpoint: config.get('creatorNodeEndpoint'),
      isRegisteredOnURSM: false,
      dataProviderUrl: config.get('dataProviderUrl'),
      audiusContentInfraSetup: '',
      country: 'US',
      latitude: '37.7749',
      longitude: '-122.4194',
      databaseConnections: 5,
      databaseSize: 1102901,
      totalMemory: 6237151232,
      usedMemory: 5969739776,
      usedTCPMemory: 922,
      storagePathSize: 62725623808,
      storagePathUsed: 54063878144,
      maxFileDescriptors: 524288,
      allocatedFileDescriptors: 3392,
      receivedBytesPerSec: 776.7638177541248,
      transferredBytesPerSec: 269500,
      maxStorageUsedPercent: 95,
      meetsMinRequirements: false,
      numberOfCPUs: 2,
      thirtyDayRollingSyncSuccessCount: 50,
      thirtyDayRollingSyncFailCount: 10,
      dailySyncSuccessCount: 5,
      dailySyncFailCount: 0,
      latestSyncSuccessTimestamp: '2021-06-08T21:29:34.231Z',
      latestSyncFailTimestamp: '',
      currentSnapbackReconfigMode: 'RECONFIG_DISABLED',
      manualSyncsDisabled: false,
      snapbackModuloBase: 18,
      snapbackUsersPerJob: 2,
      stateMonitoringQueueRateLimitInterval: 20_000,
      stateMonitoringQueueRateLimitJobsPerInterval: 2,
      recoverOrphanedDataQueueRateLimitInterval: 50_000,
      recoverOrphanedDataQueueRateLimitJobsPerInterval: 1,
      transcodeActive: 4,
      transcodeWaiting: 0,
      transcodeQueueIsAvailable: true,
      shouldHandleTranscode: true,
      asyncProcessingQueue: {
        waiting: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 2
        },
        active: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 0
        },
        failed: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 0
        }
      },
      solDelegatePublicKeyBase58: SOL_PUBLIC_KEY_BASE58,
      stateMachineJobs: {
        latestMonitorStateJobStart: null,
        latestMonitorStateJobSuccess: null,
        latestFindSyncRequestsJobStart: null,
        latestFindSyncRequestsJobSuccess: null,
        latestFindReplicaSetUpdatesJobStart: null,
        latestFindReplicaSetUpdatesJobSuccess: null
      },
      trustedNotifier: {
        email: 'trusted@notifier.com',
        wallet: '0x73EB6d82CFB20bA669e9c178b718d770C49AAAAA',
        endpoint: 'default.trustednotifier',
        id: 12
      }
    })
  })

  it('Should handle no libs', async function () {
    config.set('serviceCountry', 'US')
    config.set('serviceLatitude', '37.7749')
    config.set('serviceLongitude', '-122.4194')
    config.set('maxStorageUsedPercent', 95)
    config.set('snapbackUsersPerJob', 2)
    config.set('stateMonitoringQueueRateLimitInterval', 20_000)
    config.set('stateMonitoringQueueRateLimitJobsPerInterval', 2)
    config.set('recoverOrphanedDataQueueRateLimitInterval', 50_000)
    config.set('recoverOrphanedDataQueueRateLimitJobsPerInterval', 1)
    config.set('snapbackModuloBase', 18)
    config.set('manualSyncsDisabled', false)
    config.set('solDelegatePrivateKeyBase64', SOL_SECRET_KEY_BASE64)

    const res = await healthCheck(
      {
        stateMachineManager: stateMachineManagerMock,
        asyncProcessingQueue: AsyncProcessingQueueMock(0, 2),
        trustedNotifierManager: trustedNotifierManagerMock
      },
      mockLogger,
      sequelizeMock,
      getMonitorsMock,
      TranscodingQueueMock(4, 0).getTranscodeQueueJobs,
      TranscodingQueueMock(4, 0).isAvailable,
      AsyncProcessingQueueMock(0, 2).getAsyncProcessingQueueJobs,
      2
    )

    assert.deepStrictEqual(res, {
      ...version,
      service: 'content-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: 'none',
      spID: config.get('spID'),
      spOwnerWallet: config.get('spOwnerWallet'),
      creatorNodeEndpoint: config.get('creatorNodeEndpoint'),
      isRegisteredOnURSM: false,
      dataProviderUrl: config.get('dataProviderUrl'),
      audiusContentInfraSetup: '',
      country: 'US',
      latitude: '37.7749',
      longitude: '-122.4194',
      databaseConnections: 5,
      databaseSize: 1102901,
      totalMemory: 6237151232,
      usedMemory: 5969739776,
      usedTCPMemory: 922,
      storagePathSize: 62725623808,
      storagePathUsed: 54063878144,
      maxFileDescriptors: 524288,
      allocatedFileDescriptors: 3392,
      receivedBytesPerSec: 776.7638177541248,
      transferredBytesPerSec: 269500,
      maxStorageUsedPercent: 95,
      meetsMinRequirements: false,
      numberOfCPUs: 2,
      thirtyDayRollingSyncSuccessCount: 50,
      thirtyDayRollingSyncFailCount: 10,
      dailySyncSuccessCount: 5,
      dailySyncFailCount: 0,
      latestSyncSuccessTimestamp: '2021-06-08T21:29:34.231Z',
      latestSyncFailTimestamp: '',
      currentSnapbackReconfigMode: 'RECONFIG_DISABLED',
      manualSyncsDisabled: false,
      snapbackModuloBase: 18,
      snapbackUsersPerJob: 2,
      stateMonitoringQueueRateLimitInterval: 20_000,
      stateMonitoringQueueRateLimitJobsPerInterval: 2,
      recoverOrphanedDataQueueRateLimitInterval: 50_000,
      recoverOrphanedDataQueueRateLimitJobsPerInterval: 1,
      transcodeActive: 4,
      transcodeWaiting: 0,
      transcodeQueueIsAvailable: true,
      shouldHandleTranscode: true,
      asyncProcessingQueue: {
        waiting: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 2
        },
        active: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 0
        },
        failed: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 0
        }
      },
      solDelegatePublicKeyBase58: SOL_PUBLIC_KEY_BASE58,
      stateMachineJobs: {
        latestMonitorStateJobStart: null,
        latestMonitorStateJobSuccess: null,
        latestFindSyncRequestsJobStart: null,
        latestFindSyncRequestsJobSuccess: null,
        latestFindReplicaSetUpdatesJobStart: null,
        latestFindReplicaSetUpdatesJobSuccess: null
      },
      trustedNotifier: {
        email: 'trusted@notifier.com',
        wallet: '0x73EB6d82CFB20bA669e9c178b718d770C49AAAAA',
        endpoint: 'default.trustednotifier',
        id: 12
      }
    })
  })

  it('Should return "meetsMinRequirements" = false if system requirements arent met', async function () {
    const res = await healthCheck(
      {
        stateMachineManager: stateMachineManagerMock,
        asyncProcessingQueue: AsyncProcessingQueueMock(0, 2),
        trustedNotifierManager: trustedNotifierManagerMock
      },
      mockLogger,
      sequelizeMock,
      getMonitorsMock,
      TranscodingQueueMock(4, 0).getTranscodeQueueJobs,
      TranscodingQueueMock(4, 0).isAvailable,
      AsyncProcessingQueueMock(0, 2).getAsyncProcessingQueueJobs,
      2
    )

    assert.deepStrictEqual(res, {
      ...version,
      service: 'content-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: 'none',
      spID: config.get('spID'),
      spOwnerWallet: config.get('spOwnerWallet'),
      creatorNodeEndpoint: config.get('creatorNodeEndpoint'),
      isRegisteredOnURSM: false,
      dataProviderUrl: config.get('dataProviderUrl'),
      audiusContentInfraSetup: '',
      country: 'US',
      latitude: '37.7749',
      longitude: '-122.4194',
      databaseConnections: 5,
      databaseSize: 1102901,
      totalMemory: 6237151232,
      usedMemory: 5969739776,
      usedTCPMemory: 922,
      storagePathSize: 62725623808,
      storagePathUsed: 54063878144,
      maxFileDescriptors: 524288,
      allocatedFileDescriptors: 3392,
      receivedBytesPerSec: 776.7638177541248,
      transferredBytesPerSec: 269500,
      maxStorageUsedPercent: 95,
      meetsMinRequirements: false,
      numberOfCPUs: 2,
      thirtyDayRollingSyncSuccessCount: 50,
      thirtyDayRollingSyncFailCount: 10,
      dailySyncSuccessCount: 5,
      dailySyncFailCount: 0,
      latestSyncSuccessTimestamp: '2021-06-08T21:29:34.231Z',
      latestSyncFailTimestamp: '',
      currentSnapbackReconfigMode: 'RECONFIG_DISABLED',
      manualSyncsDisabled: false,
      snapbackModuloBase: 18,
      snapbackUsersPerJob: 2,
      stateMonitoringQueueRateLimitInterval: 20_000,
      stateMonitoringQueueRateLimitJobsPerInterval: 2,
      recoverOrphanedDataQueueRateLimitInterval: 50_000,
      recoverOrphanedDataQueueRateLimitJobsPerInterval: 1,
      transcodeActive: 4,
      transcodeWaiting: 0,
      transcodeQueueIsAvailable: true,
      shouldHandleTranscode: true,
      asyncProcessingQueue: {
        waiting: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 2
        },
        active: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 0
        },
        failed: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 0
        }
      },
      solDelegatePublicKeyBase58: SOL_PUBLIC_KEY_BASE58,
      stateMachineJobs: {
        latestMonitorStateJobStart: null,
        latestMonitorStateJobSuccess: null,
        latestFindSyncRequestsJobStart: null,
        latestFindSyncRequestsJobSuccess: null,
        latestFindReplicaSetUpdatesJobStart: null,
        latestFindReplicaSetUpdatesJobSuccess: null
      },
      trustedNotifier: {
        email: 'trusted@notifier.com',
        wallet: '0x73EB6d82CFB20bA669e9c178b718d770C49AAAAA',
        endpoint: 'default.trustednotifier',
        id: 12
      }
    })

    assert.deepStrictEqual(res.meetsMinRequirements, false)
  })

  it('Should derive Solana public key from Ethereum private key', function () {
    // Set initial config values
    const privateKeyBuffer = Buffer.from(ETH_PRIV_KEY.replace('0x', ''), 'hex')
    const solKeyPair = Keypair.fromSeed(privateKeyBuffer)
    const solSecretKey = solKeyPair.secretKey
    config.set(
      'solDelegatePrivateKeyBase64',
      Buffer.from(solSecretKey).toString('base64')
    )

    // Get values from config and derive Solana public key
    const solSecretKeyDerived = config.get('solDelegatePrivateKeyBase64')
    const solSecretKeyBufferDerived = new Uint8Array(
      Buffer.from(solSecretKeyDerived, 'base64')
    )
    const solKeyPairDerived = Keypair.fromSecretKey(solSecretKeyBufferDerived)
    const solPublicKeyDerived = solKeyPairDerived.publicKey

    // Verify derived values are correct and using the right encodings
    assert.strictEqual(
      new TextDecoder('utf8').decode(solSecretKey).toString(),
      SOL_SECRET_KEY_BUFFER.toString('utf8')
    )
    assert.strictEqual(solSecretKeyDerived, SOL_SECRET_KEY_BASE64)
    assert.strictEqual(solPublicKeyDerived.toBase58(), SOL_PUBLIC_KEY_BASE58)
  })
})

describe('Test Health Check Verbose', function () {
  it('Should have valid values', async function () {
    config.set('serviceCountry', 'US')
    config.set('serviceLatitude', '37.7749')
    config.set('serviceLongitude', '-122.4194')
    config.set('maxStorageUsedPercent', 95)
    config.set('snapbackUsersPerJob', 2)
    config.set('stateMonitoringQueueRateLimitInterval', 20_000)
    config.set('stateMonitoringQueueRateLimitJobsPerInterval', 2)
    config.set('recoverOrphanedDataQueueRateLimitInterval', 50_000)
    config.set('recoverOrphanedDataQueueRateLimitJobsPerInterval', 1)
    config.set('snapbackModuloBase', 18)
    config.set('manualSyncsDisabled', false)

    const res = await healthCheckVerbose(
      {
        stateMachineManager: stateMachineManagerMock,
        asyncProcessingQueue: AsyncProcessingQueueMock(0, 2),
        trustedNotifierManager: trustedNotifierManagerMock
      },
      mockLogger,
      sequelizeMock,
      getMonitorsMock,
      2,
      TranscodingQueueMock(4, 0).getTranscodeQueueJobs,
      TranscodingQueueMock(4, 0).isAvailable,
      AsyncProcessingQueueMock(0, 2).getAsyncProcessingQueueJobs
    )

    assert.deepStrictEqual(res, {
      ...version,
      service: 'content-node',
      healthy: true,
      git: undefined,
      selectedDiscoveryProvider: 'none',
      spID: config.get('spID'),
      spOwnerWallet: config.get('spOwnerWallet'),
      creatorNodeEndpoint: config.get('creatorNodeEndpoint'),
      isRegisteredOnURSM: false,
      dataProviderUrl: config.get('dataProviderUrl'),
      audiusContentInfraSetup: '',
      country: 'US',
      latitude: '37.7749',
      longitude: '-122.4194',
      databaseConnections: 5,
      databaseSize: 1102901,
      totalMemory: 6237151232,
      usedMemory: 5969739776,
      usedTCPMemory: 922,
      storagePathSize: 62725623808,
      storagePathUsed: 54063878144,
      maxFileDescriptors: 524288,
      allocatedFileDescriptors: 3392,
      receivedBytesPerSec: 776.7638177541248,
      transferredBytesPerSec: 269500,
      maxStorageUsedPercent: 95,
      meetsMinRequirements: false,
      numberOfCPUs: 2,
      thirtyDayRollingSyncSuccessCount: 50,
      thirtyDayRollingSyncFailCount: 10,
      dailySyncSuccessCount: 5,
      dailySyncFailCount: 0,
      latestSyncSuccessTimestamp: '2021-06-08T21:29:34.231Z',
      latestSyncFailTimestamp: '',
      currentSnapbackReconfigMode: 'RECONFIG_DISABLED',
      manualSyncsDisabled: false,
      snapbackModuloBase: 18,
      snapbackUsersPerJob: 2,
      stateMonitoringQueueRateLimitInterval: 20_000,
      stateMonitoringQueueRateLimitJobsPerInterval: 2,
      recoverOrphanedDataQueueRateLimitInterval: 50_000,
      recoverOrphanedDataQueueRateLimitJobsPerInterval: 1,
      transcodeActive: 4,
      transcodeWaiting: 0,
      transcodeQueueIsAvailable: true,
      shouldHandleTranscode: true,
      asyncProcessingQueue: {
        waiting: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 2
        },
        active: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 0
        },
        failed: {
          trackContentUpload: 0,
          transcodeAndSegment: 0,
          processTranscodeAndSegments: 0,
          transcodeHandOff: 0,
          total: 0
        }
      },
      solDelegatePublicKeyBase58: SOL_PUBLIC_KEY_BASE58,
      stateMachineJobs: {
        latestMonitorStateJobStart: null,
        latestMonitorStateJobSuccess: null,
        latestFindSyncRequestsJobStart: null,
        latestFindSyncRequestsJobSuccess: null,
        latestFindReplicaSetUpdatesJobStart: null,
        latestFindReplicaSetUpdatesJobSuccess: null
      },
      trustedNotifier: {
        email: 'trusted@notifier.com',
        wallet: '0x73EB6d82CFB20bA669e9c178b718d770C49AAAAA',
        endpoint: 'default.trustednotifier',
        id: 12
      }
    })
  })

  it('Should be the same as default health check', async function () {
    config.set('serviceCountry', 'US')
    config.set('serviceLatitude', '37.7749')
    config.set('serviceLongitude', '-122.4194')
    config.set('maxStorageUsedPercent', 95)
    config.set('snapbackUsersPerJob', 2)
    config.set('stateMonitoringQueueRateLimitInterval', 20_000)
    config.set('stateMonitoringQueueRateLimitJobsPerInterval', 2)
    config.set('recoverOrphanedDataQueueRateLimitInterval', 50_000)
    config.set('recoverOrphanedDataQueueRateLimitJobsPerInterval', 1)
    config.set('snapbackModuloBase', 18)
    config.set('manualSyncsDisabled', false)

    const verboseRes = await healthCheckVerbose(
      {
        libs: libsMock,
        stateMachineManager: stateMachineManagerMock,
        asyncProcessingQueue: AsyncProcessingQueueMock(0, 2),
        trustedNotifierManager: trustedNotifierManagerMock
      },
      mockLogger,
      sequelizeMock,
      getMonitorsMock,
      2,
      TranscodingQueueMock(4, 0).getTranscodeQueueJobs,
      TranscodingQueueMock(4, 0).isAvailable,
      AsyncProcessingQueueMock(0, 2).getAsyncProcessingQueueJobs
    )
    const defaultRes = await healthCheck(
      {
        libs: libsMock,
        stateMachineManager: stateMachineManagerMock,
        asyncProcessingQueue: AsyncProcessingQueueMock(0, 2),
        trustedNotifierManager: trustedNotifierManagerMock
      },
      mockLogger,
      sequelizeMock,
      getMonitorsMock,
      TranscodingQueueMock(4, 0).getTranscodeQueueJobs,
      TranscodingQueueMock(4, 0).isAvailable,
      AsyncProcessingQueueMock(0, 2).getAsyncProcessingQueueJobs,
      2
    )

    assert.deepStrictEqual(verboseRes, defaultRes)
  })
})
