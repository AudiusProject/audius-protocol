'use strict'

const S3 = require('aws-sdk').S3
const ON_DEATH = require('death')
const ipfsAPI = require('ipfs-api')
const path = require('path')

const initializeApp = require('./app')
const config = require('./config')
const { sequelize } = require('./models')
const { runMigrations } = require('./migrationManager')
const { logger } = require('./logging')

// configure file storage
let s3bucket = null
let storageDir = null
if (config.get('awsBucket')) {
  logger.info('Running with AWS storage backend: ', config.get('awsBucket'))

  if (!config.get('awsAccessKeyId') || !config.get('awsSecretAccessKey')) {
    logger.error('Must set awsAccessKeyId and awsSecretAccessKey to use AWS backend')
    process.exit(1)
  }

  s3bucket = new S3({
    params: {
      Bucket: config.get('awsBucket')
    },
    accessKeyId: config.get('awsAccessKeyId'),
    secretAccessKey: config.get('awsSecretAccessKey')
  })

  // until we use the s3 bucket, prevent confusion when running creator node
  console.error('AWS backend not yet supported. Please remove these configuration options and run with local storage backend.')
  process.exit(1)
} else if (config.get('storagePath')) {
  storageDir = path.resolve('./', config.get('storagePath'))
  logger.info('Running with local storage backend: ', storageDir)
} else {
  logger.error('Must set AWS bucket or file path to use for content repository; both are missing')
  process.exit(1)
}

// run config
logger.info('Configuring service...')
config.asyncConfig().then(() => {
  logger.info('Service configured')
})

// connect to IPFS
let ipfsAddr = config.get('ipfsHost')
if (!ipfsAddr) {
  logger.error('Must set ipfsAddr')
  process.exit(1)
}
let ipfs = ipfsAPI(ipfsAddr, config.get('ipfsPort'))

// run all migrations
logger.info('Executing database migrations...')
runMigrations().then(async () => {
  logger.info('Migrations completed successfully')
}).error((err) => {
  logger.error('Error in migrations: ', err)
  process.exit(1)
})

const appInfo = initializeApp(config.get('port'), storageDir, s3bucket, ipfs)

// when app terminates, close down any open DB connections gracefully
ON_DEATH((signal, error) => {
  // NOTE: log messages emitted here may be swallowed up if using the bunyan CLI (used by
  // default in `npm start` command). To see messages emitted after a kill signal, do not
  // use the bunyan CLI.
  logger.info('Shutting down db and express app...')
  sequelize.close()
  appInfo.server.close()
})
