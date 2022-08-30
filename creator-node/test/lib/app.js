const nodeConfig = require('../../src/config.js')
const { runMigrations, clearDatabase } = require('../../src/migrationManager')
const redisClient = require('../../src/redis')
const MonitoringQueueMock = require('./monitoringQueueMock')
const AsyncProcessingQueueMock = require('./asyncProcessingQueueMock')
const SyncQueue = require('../../src/services/sync/syncQueue')
const TrustedNotifierManager = require('../../src/services/TrustedNotifierManager.js')
const PrometheusRegistry = require('../../src/services/prometheusMonitoring/prometheusRegistry')
const BlacklistManager = require('../../src/blacklistManager')
const ImageProcessingQueue = require('../../src/ImageProcessingQueue.js')

async function getApp(
  libsClient,
  blacklistManager = BlacklistManager,
  setMockFn = null,
  spId = 1
) {
  // we need to clear the cache that commonjs require builds, otherwise it uses old values for imports etc
  // eg if you set a new env var, it doesn't propogate well unless you clear the cache for the config file as well
  // as all files that consume it
  clearRequireCache()

  // run all migrations before each test
  await clearDatabase()
  await runMigrations()

  if (spId) nodeConfig.set('spID', spId)

  const prometheusRegistry = new PrometheusRegistry()
  const apq = new AsyncProcessingQueueMock(libsClient, prometheusRegistry)
  const mockServiceRegistry = {
    libs: libsClient,
    blacklistManager,
    redis: redisClient,
    monitoringQueue: new MonitoringQueueMock(prometheusRegistry),
    asyncProcessingQueue: apq,
    imageProcessingQueue: new ImageProcessingQueue(),
    nodeConfig,
    syncQueue: new SyncQueue(nodeConfig, redisClient),
    trustedNotifierManager: new TrustedNotifierManager(nodeConfig, libsClient),
    prometheusRegistry
  }

  // Update the import to be the mocked ServiceRegistry instance
  require.cache[require.resolve('../../src/serviceRegistry')] = {
    exports: { serviceRegistry: mockServiceRegistry }
  }

  // If one needs to set mock settings, pass in a callback to set it before initializing app
  if (setMockFn) setMockFn()

  const appInfo = require('../../src/app')(8000, mockServiceRegistry)
  appInfo.mockServiceRegistry = mockServiceRegistry
  return appInfo
}

function getServiceRegistryMock(libsClient, blacklistManager) {
  const prometheusRegistry = new PrometheusRegistry()
  return {
    libs: libsClient,
    blacklistManager: blacklistManager,
    redis: redisClient,
    monitoringQueue: new MonitoringQueueMock(prometheusRegistry),
    syncQueue: new SyncQueue(nodeConfig, redisClient),
    nodeConfig,
    initLibs: async function () {},
    prometheusRegistry
  }
}

function clearRequireCache() {
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
