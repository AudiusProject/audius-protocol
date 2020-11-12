const { runMigrations, clearDatabase } = require('../../src/migrationManager')
const config = require('../../src/config')
const redisClient = require('../../src/redis')

// Initialize private IPFS gateway counters
redisClient.set('ipfsGatewayReqs', 0)
redisClient.set('ipfsStandaloneReqs', 0)

async function getApp (ipfsMock, libsMock, blacklistManager) {
  delete require.cache[require.resolve('../../src/app')] // force reload between each test
  delete require.cache[require.resolve('../../src/config')]
  delete require.cache[require.resolve('../../src/fileManager')]
  delete require.cache[require.resolve('../../src/blacklistManager')]
  delete require.cache[require.resolve('../../src/routes/tracks')]
  delete require.cache[require.resolve('../../src/routes/files')]

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

module.exports = { getApp }
