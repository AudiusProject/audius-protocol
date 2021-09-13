const assert = require('assert')

const { healthCheck, healthCheckVerbose } = require('./healthCheckComponentService')
const version = require('../../../.version.json')
const config = require('../../../src/config')
const { MONITORS } = require('../../monitors/monitors')

const TEST_ENDPOINT = 'test_endpoint'

const snapbackSMMock = {
  highestEnabledReconfigMode: 'RECONFIG_DISABLED'
}

const libsMock = {
  discoveryProvider: {
    discoveryProviderEndpoint: TEST_ENDPOINT
  }
}

const sequelizeMock = {
  'query': async () => Promise.resolve()
}

const getMonitorsMock = async (monitors) => {
  return monitors.map(monitor => {
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
    }
  }
}

describe('Test Health Check', function () {
  it('Should pass', async function () {
    config.set('serviceCountry', 'US')
    config.set('serviceLatitude', '37.7749')
    config.set('serviceLongitude', '-122.4194')
    config.set('maxStorageUsedPercent', 95)
    config.set('snapbackJobInterval', 1000)
    config.set('snapbackModuloBase', 18)
    config.set('manualSyncsDisabled', false)

    config.set('creatorNodeEndpoint', 'http://test.endpoint')
    config.set('spID', 10)

    const res = await healthCheck({ libs: libsMock, snapbackSM: snapbackSMMock }, mockLogger, sequelizeMock, getMonitorsMock, TranscodingQueueMock(4, 0).getTranscodeQueueJobs, 2)

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
      snapbackJobInterval: 1000,
      transcodeActive: 4,
      transcodeWaiting: 0
    })
  })

  it('Should handle no libs', async function () {
    config.set('serviceCountry', 'US')
    config.set('serviceLatitude', '37.7749')
    config.set('serviceLongitude', '-122.4194')
    config.set('maxStorageUsedPercent', 95)
    config.set('snapbackJobInterval', 1000)
    config.set('snapbackModuloBase', 18)
    config.set('manualSyncsDisabled', false)

    const res = await healthCheck({ snapbackSM: snapbackSMMock }, mockLogger, sequelizeMock, getMonitorsMock, TranscodingQueueMock(4, 0).getTranscodeQueueJobs, 2)

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
      snapbackJobInterval: 1000,
      transcodeActive: 4,
      transcodeWaiting: 0
    })
  })

  it('Should return "meetsMinRequirements" = false if system requirements arent met', async function () {
    const res = await healthCheck({ snapbackSM: snapbackSMMock }, mockLogger, sequelizeMock, getMonitorsMock, TranscodingQueueMock(4, 0).getTranscodeQueueJobs, 2)

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
      snapbackJobInterval: 1000,
      transcodeActive: 4,
      transcodeWaiting: 0
    })

    assert.deepStrictEqual(res.meetsMinRequirements, false)
  })
})

describe('Test Health Check Verbose', function () {
  it('Should have valid values', async function () {
    config.set('serviceCountry', 'US')
    config.set('serviceLatitude', '37.7749')
    config.set('serviceLongitude', '-122.4194')
    config.set('maxStorageUsedPercent', 95)
    config.set('snapbackJobInterval', 1000)
    config.set('snapbackModuloBase', 18)
    config.set('manualSyncsDisabled', false)

    const serviceRegistryMock = {
      snapbackSM: {
        highestEnabledReconfigMode: 'RECONFIG_DISABLED'
      }
    }

    const res = await healthCheckVerbose(serviceRegistryMock, mockLogger, sequelizeMock, getMonitorsMock, 2, TranscodingQueueMock(4, 0).getTranscodeQueueJobs)

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
      snapbackJobInterval: 1000,
      transcodeActive: 4,
      transcodeWaiting: 0
    })
  })
})
