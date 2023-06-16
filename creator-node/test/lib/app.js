import { initializeApp } from '../../src/app'
import { ImageProcessingQueue } from '../../src/ImageProcessingQueue'
const nodeConfig = require('../../src/config.js')
const {
  runMigrations,
  clearDatabase,
  clearRunningQueries
} = require('../../src/migrationManager')
const redisClient = require('../../src/redis')
const MonitoringQueueMock = require('./monitoringQueueMock')
const AsyncProcessingQueueMock = require('./asyncProcessingQueueMock')
const { SyncQueue } = require('../../src/services/sync/syncQueue')
const PrometheusRegistry = require('../../src/services/prometheusMonitoring/prometheusRegistry')

export async function getApp(
  libsClient,
  setMockFn = null,
  spId = 1,
  mockContentNodeInfoManager = false
) {
  // we need to clear the cache that commonjs require builds, otherwise it uses old values for imports etc
  // eg if you set a new env var, it doesn't propogate well unless you clear the cache for the config file as well
  // as all files that consume it
  clearRequireCache()

  // run all migrations before each test
  await clearRunningQueries()
  await clearDatabase()
  await runMigrations()

  if (spId) nodeConfig.set('spID', spId)

  const prometheusRegistry = new PrometheusRegistry()
  const apq = new AsyncProcessingQueueMock(libsClient, prometheusRegistry)
  const syncQueue = new SyncQueue()
  syncQueue.init(nodeConfig, redisClient)
  const mockServiceRegistry = {
    libs: libsClient,
    redis: redisClient,
    monitoringQueue: new MonitoringQueueMock(),
    asyncProcessingQueue: apq,
    imageProcessingQueue: new ImageProcessingQueue(),
    nodeConfig,
    syncQueue: syncQueue,
    prometheusRegistry
  }

  // Update import to make ensureValidSPMiddleware pass
  if (mockContentNodeInfoManager) {
    const getContentNodeInfoFromSpId = async (spID, _genericLogger) => {
      switch (spID) {
        case 2:
          return {
            endpoint: 'http://mock-cn2.audius.co',
            owner: '0xBdb47ebFF0eAe1A7647D029450C05666e22864Fb',
            delegateOwnerWallet: '0xBdb47ebFF0eAe1A7647D029450C05666e22864Fb'
          }
        case 3:
          return {
            endpoint: 'http://mock-cn3.audius.co',
            owner: '0x1Fffaa556B42f4506cdb01D7BbE6a9bDbb0E5f36',
            delegateOwnerWallet: '0x1Fffaa556B42f4506cdb01D7BbE6a9bDbb0E5f36'
          }

        case 1:
          return {
            endpoint: 'http://mock-cn1.audius.co',
            owner: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25',
            delegateOwnerWallet: '0x1eC723075E67a1a2B6969dC5CfF0C6793cb36D25'
          }
        default:
          return {
            owner: '0x0000000000000000000000000000000000000000',
            endpoint: '',
            delegateOwnerWallet: '0x0000000000000000000000000000000000000000'
          }
      }
    }
    require.cache[
      require.resolve('../../src/services/ContentNodeInfoManager')
    ] = {
      exports: { getContentNodeInfoFromSpId }
    }
  }

  // Update the import to be the mocked ServiceRegistry instance
  require.cache[require.resolve('../../src/serviceRegistry')] = {
    exports: { serviceRegistry: mockServiceRegistry }
  }

  // If one needs to set mock settings, pass in a callback to set it before initializing app
  if (setMockFn) setMockFn()

  const appInfo = initializeApp(8000, mockServiceRegistry)
  appInfo.mockServiceRegistry = mockServiceRegistry
  return appInfo
}

export async function getServiceRegistryMock(libsClient) {
  const syncQueue = new SyncQueue()
  await syncQueue.init(nodeConfig, redisClient)
  return {
    libs: libsClient,
    redis: redisClient,
    monitoringQueue: new MonitoringQueueMock(),
    syncQueue: syncQueue,
    nodeConfig,
    initLibs: async function () {},
    prometheusRegistry: new PrometheusRegistry()
  }
}

export function clearRequireCache() {
  console.log('DELETING CACHE')
  Object.keys(require.cache).forEach(function (key) {
    // exclude src/models/index from the key deletion because it initalizes a new connection pool
    // every time and we hit a db error if we clear the cache and keep creating new pg pools
    if (
      key.includes('creator-node/src/') &&
      !key.includes('creator-node/src/models/index.js')
    ) {
      delete require.cache[key]
    }
  })
}

module.exports = { getApp, getServiceRegistryMock }
