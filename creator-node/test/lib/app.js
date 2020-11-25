const { runMigrations, clearDatabase } = require('../../src/migrationManager')
const redisClient = require('../../src/redis')

// Initialize private IPFS gateway counters
redisClient.set('ipfsGatewayReqs', 0)
redisClient.set('ipfsStandaloneReqs', 0)

async function getApp (ipfsMock, libsMock, blacklistManager) {
  _clearRequireCache()
  console.log("cleared all require caches")

  // run all migrations before each test
  await clearDatabase()
  await runMigrations()

  const mockServiceRegistry = {
    ipfs: ipfsMock,
    ipfsLatest: ipfsMock,
    libs: libsMock,
    blacklistManager: blacklistManager,
    redis: redisClient
  }

  const appInfo = require('../../src/app')(8000, mockServiceRegistry)

  return appInfo
}

function _clearRequireCache() {
  Object.keys(require.cache).forEach(function(key) {
    if (key.includes('creator-node/src/')) {
      console.log('deleting cache', key)
      delete require.cache[key]
    }
  })
}

module.exports = { getApp }
