const Bull = require('bull')
const config = require('./config')
const { rehydrateIpfsFromFsIfNecessary, rehydrateIpfsDirFromFsIfNecessary } = require('./utils')
const { logger: genericLogger } = require('./logging')

const PROCESS_NAMES = Object.freeze({
  rehydrateDir: 'rehydrate_dir',
  rehydrateFs: 'rehydrate_fs'
})

class RehydrateIpfsQueue {
  constructor () {
    this.queue = new Bull(
      'rehydrateIPFS',
      {
        redis: {
          host: config.get('redisHost'),
          port: config.get('redisPort')
        }
      }
    )

    this.queue.process(PROCESS_NAMES.rehydrateFs, async (job, done) => {
      const { multihash, storagePath, filename, logContext } = job.data

      this.logStatus(logContext, `RehydrateIpfsQueue - Processing a rehydrateIpfsFromFsIfNecessary task for ${multihash}`)
      // TODO: all the expected rehydrate errors are caught/logged. so catch might not actually catch error
      // can instead of logging errors in rehydrate code, throw errors and handle here
      try {
        await rehydrateIpfsFromFsIfNecessary(multihash, storagePath, logContext, filename)
        this.logStatus(logContext, `RehydrateIpfsQueue - Successfully rehydrated for ${multihash}`)
        done()
      } catch (e) {
        this.logStatus(logContext, `RehydrateIpfsQueue - Problem with processing a rehydrateIpfsFromFsIfNecessary task for ${multihash}: ${e}`)
        done(e)
      }
    })

    this.queue.process(PROCESS_NAMES.rehydrateDir, async (job, done) => {
      const { multihash, logContext } = job.data
      this.logStatus(logContext, `RehydrateIpfsQueue - Processing a rehydrateIpfsDirFromFsIfNecessary task for ${multihash}`)
      try {
        await rehydrateIpfsDirFromFsIfNecessary(multihash, logContext)
        this.logStatus(logContext, `RehydrateIpfsQueue - Successfully rehydrated for ${multihash}`)
        done()
      } catch (e) {
        this.logStatus(logContext, `RehydrateIpfsQueue - Problem with processing a rehydrateIpfsDirFromFsIfNecessary task for ${multihash}: ${e}`)
        done(e)
      }
    })

    this.addRehydrateIpfsFromFsTask = this.addRehydrateIpfsFromFsIfNecessaryTask.bind(this)
    this.addRehydrateIpfsDirFromFsIfNecessaryTask = this.addRehydrateIpfsDirFromFsIfNecessaryTask.bind(this)
  }

  async logStatus (logContext, message) {
    const logger = genericLogger.child(logContext)
    const count = await this.queue.count()
    logger.info(`RehydrateIpfsQueue Queue: ${message}`)
    logger.info(`RehydrateIpfsQueue Queue: count: ${count}`)
  }

  /**
   * Adds rehydrate from fs task
   * @param {*} multihash
   * @param {*} storagePath
   * @param {*} logContext
   */
  async addRehydrateIpfsFromFsIfNecessaryTask (multihash, storagePath, { logContext }, filename = null) {
    this.logStatus(logContext, 'RehydrateIpfsQueue - Adding a rehydrateIpfsFromFsIfNecessary task to the queue!')
    const job = await this.queue.add(
      PROCESS_NAMES.rehydrateFs,
      { multihash, storagePath, filename, logContext }
    )
    this.logStatus(logContext, 'RehydrateIpfsQueue - Successfully added a rehydrateIpfsFromFsIfNecessary task!')

    return job
  }

  /**
   * Adds rehydrate from fs task
   * @param {*} multihash
   * @param {*} storagePath
   * @param {*} logContext
   */
  async addRehydrateIpfsDirFromFsIfNecessaryTask (multihash, { logContext }) {
    this.logStatus(logContext, 'RehydrateIpfsQueue - Adding a rehydrateIpfsDirFromFsIfNecessary task to the queue!')
    const job = await this.queue.add(
      PROCESS_NAMES.rehydrateDir,
      { multihash, logContext }
    )
    this.logStatus(logContext, 'RehydrateIpfsQueue - Successfully added a rehydrateIpfsDirFromFsIfNecessary task!')

    return job
  }
}

module.exports = new RehydrateIpfsQueue()
