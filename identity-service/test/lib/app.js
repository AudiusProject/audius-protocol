const { runMigrations, clearDatabase } = require('../../src/migrationManager')

async function getApp (s3bucket, ipfsMock) {
  delete require.cache[require.resolve('../../src/app')] // force reload between each test
  const appInfo = require('../../src/app')(8000)

  // run all migrations before each test
  await clearDatabase()
  await runMigrations()

  return appInfo
}

module.exports = { getApp }
