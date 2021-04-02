const Bull = require('bull')
const { rehydrateIpfsFromFsIfNecessary, rehydrateIpfsDirFromFsIfNecessary } = require('./utils')
const { logger: genericLogger } = require('./logging')
const config = require('./config')
const enableRehydrate = config.get('enableRehydrate')

const PROCESS_NAMES = Object.freeze({
  rehydrate_dir: 'rehydrate_dir',
  rehydrate_file: 'rehydrate_file'
})

const MAX_COUNT = 10000

class RehydrateIpfsQueue {
  constructor () {
    this.queue = new Bull(
      'rehydrateIpfs',
      {
        redis: {
          host: config.get('redisHost'),
          port: config.get('redisPort')
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true
        }
      }
    )

    // Most errors in the rehydrate calls will be caught; this try/catch is to catch unexpected errors

    this.queue.process(PROCESS_NAMES.rehydrate_file, config.get('rehydrateMaxConcurrency'), async (job, done) => {
      const { multihash, storagePath, filename, logContext } = job.data

      this.logStatus(logContext, `Processing a rehydrateIpfsFromFsIfNecessary task for ${multihash}`)
      try {
        await rehydrateIpfsFromFsIfNecessary(multihash, storagePath, logContext, filename)
        done()
      } catch (e) {
        this.logError(logContext, `Problem with processing a rehydrateIpfsFromFsIfNecessary task for ${multihash}: ${e}`)
        done(e)
      }
    })

    this.queue.process(PROCESS_NAMES.rehydrate_dir, config.get('rehydrateMaxConcurrency'), async (job, done) => {
      const { multihash, logContext } = job.data
      this.logStatus(logContext, `Processing a rehydrateIpfsDirFromFsIfNecessary task for ${multihash}`)
      try {
        await rehydrateIpfsDirFromFsIfNecessary(multihash, logContext)
        done()
      } catch (e) {
        this.logError(logContext, `Problem with processing a rehydrateIpfsDirFromFsIfNecessary task for ${multihash}: ${e}`)
        done(e)
      }
    })

    this.addRehydrateIpfsFromFsIfNecessaryTask = this.addRehydrateIpfsFromFsIfNecessaryTask.bind(this)
    this.addRehydrateIpfsDirFromFsIfNecessaryTask = this.addRehydrateIpfsDirFromFsIfNecessaryTask.bind(this)
  }

  async logStatus (logContext, message) {
    const logger = genericLogger.child(logContext)
    const count = await this.queue.count()
    logger.debug(`RehydrateIpfsQueue: ${message}, count: ${count}`)
  }

  async logError (logContext, message) {
    const logger = genericLogger.child(logContext)
    logger.error(`RehydrateIpfsQueue error: ${message}`)
  }

  /**
   * Adds rehydrate file task
   * @param {string} multihash
   * @param {string} storagePath
   * @param {object} logContext
   */
  async addRehydrateIpfsFromFsIfNecessaryTask (multihash, storagePath, { logContext }, filename = null) {
    if (enableRehydrate) {
      this.logStatus(logContext, 'Adding a rehydrateIpfsFromFsIfNecessary task to the queue!')
      const count = await this.queue.count()
      if (count > MAX_COUNT) return
      const job = await this.queue.add(
        PROCESS_NAMES.rehydrate_file,
        { multihash, storagePath, filename, logContext }
      )
      this.logStatus(logContext, 'Successfully added a rehydrateIpfsFromFsIfNecessary task!')

      return job
    }
  }

  /**
   * Adds rehydrate directory task
   * @param {string} multihash
   * @param {object} logContext
   */
  async addRehydrateIpfsDirFromFsIfNecessaryTask (multihash, { logContext }) {
    if (enableRehydrate) {
      this.logStatus(logContext, 'Adding a rehydrateIpfsDirFromFsIfNecessary task to the queue!')
      const count = await this.queue.count()
      if (count > MAX_COUNT) return
      const job = await this.queue.add(
        PROCESS_NAMES.rehydrate_dir,
        { multihash, logContext }
      )
      this.logStatus(logContext, 'Successfully added a rehydrateIpfsDirFromFsIfNecessary task!')

      return job
    }
  }
}

module.exports = new RehydrateIpfsQueue()
