const { runMigrations, clearDatabase } = require('../../src/migrationManager')

async function getApp (ipfsMock) {
  delete require.cache[require.resolve('../../src/app')] // force reload between each test
  const appInfo = require('../../src/app')(8000, ipfsMock)

  // run all migrations before each test
  await clearDatabase()
  await runMigrations()

  return appInfo
}

module.exports = { getApp }
