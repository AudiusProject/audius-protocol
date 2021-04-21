const nodeConfig = require('../../src/config.js')
const { runMigrations, clearDatabase } = require('../../src/migrationManager')
const redisClient = require('../../src/redis')
const MonitoringQueueMock = require('./monitoringQueueMock')
const SyncQueueService = require('../../src/services/sync/syncQueueService')

// Initialize private IPFS gateway counters
redisClient.set('ipfsGatewayReqs', 0)
redisClient.set('ipfsStandaloneReqs', 0)

async function getApp (ipfsClient, libsClient, blacklistManager, ipfsLatestClient = null) {
  // we need to clear the cache that commonjs require builds, otherwise it uses old values for imports etc
  // eg if you set a new env var, it doesn't propogate well unless you clear the cache for the config file as well
  // as all files that consume it
  clearRequireCache()
  console.log('cleared all require caches')

  // run all migrations before each test
  await clearDatabase()
  await runMigrations()

  const mockServiceRegistry = {
    ipfs: ipfsClient,
    ipfsLatest: ipfsLatestClient || ipfsClient,
    libs: libsClient,
    blacklistManager: blacklistManager,
    redis: redisClient,
    monitoringQueue: new MonitoringQueueMock(),
    syncQueueService: new SyncQueueService(nodeConfig, redisClient, ipfsClient, ipfsLatestClient || ipfsClient),
    nodeConfig
  }

  const appInfo = require('../../src/app')(8000, mockServiceRegistry)
  appInfo.mockServiceRegistry = mockServiceRegistry
  return appInfo
}

function clearRequireCache () {
  Object.keys(require.cache).forEach(function (key) {
    // exclude src/models/index from the key deletion because it initalizes a new connection pool
    // every time and we hit a db error if we clear the cache and keep creating new pg pools
    if (key.includes('creator-node/src/') && !key.includes('creator-node/src/models/index.js')) {
      console.log('deleting cache', key)
      delete require.cache[key]
    }
  })
}

module.exports = { getApp }
