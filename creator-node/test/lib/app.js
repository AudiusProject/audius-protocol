const { runMigrations, clearDatabase } = require('../../src/migrationManager')
const redisClient = require('../../src/redis')

// Initialize private IPFS gateway counters
redisClient.set('ipfsGatewayReqs', 0)
redisClient.set('ipfsStandaloneReqs', 0)

async function getApp (ipfsMock, libsMock, blacklistManager) {
  // we need to clear the cache that commonjs require builds, otherwise it uses old values for imports etc
  // eg if you set a new env var, it doesn't propogate well unless you clear the cache for the config file as well
  // as all files that consume it
  clearRequireCache()
  console.log('cleared all require caches')

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

function clearRequireCache () {
  Object.keys(require.cache).forEach(function (key) {
    if (key.includes('creator-node/src/') && !key.includes('creator-node/src/models/index.js')) {
      console.log('deleting cache', key)
      delete require.cache[key]
    }
  })
}

module.exports = { getApp }
