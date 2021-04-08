const Bull = require('bull')
const { rehydrateIpfsFromFsIfNecessary, rehydrateIpfsDirFromFsIfNecessary } = require('./utils')
const { logger: genericLogger } = require('./logging')
const config = require('./config')
const enableRehydrate = config.get('enableRehydrate')
const redisClient = require('./redis')

const PROCESS_NAMES = Object.freeze({
  rehydrate_dir: 'rehydrate_dir',
  rehydrate_file: 'rehydrate_file'
})

// minimum threshold per day to rehydrate
const MIN_REHYDRATE_THRESHOLD = config.get('minRehydrateThreshold') || 10
const MAX_COUNT = 10000

class RehydrateRedisCounter {
  constructor (redis) {
    this.redis = redis
  }

  /**
   * 
   * @param {String} taskName type of rehydrate task eg 'addRehydrateIpfsFromFsIfNecessaryTask' or 'addRehydrateIpfsDirFromFsIfNecessaryTask'
   * @returns {String} redis key
   */
  static constructCounterRedisKey (taskName) {
    return `${taskName}:::counter:::${new Date().toISOString().split('T')[0]}`
  }

  // keep count in redis for the number of times rehydrate is requested for each CID
  async incrementCount (taskName, CID) {
    const count = await this.redis.hincrby(this.constructCounterRedisKey(taskName), CID)
    await this.redis.expire(this.constructCounterRedisKey(taskName), 60 * 60 * 24) // expire one day after final write
    return count
  }

  /**
   * 
   * @param {String} taskName type of rehydrate task eg 'addRehydrateIpfsFromFsIfNecessaryTask' or 'addRehydrateIpfsDirFromFsIfNecessaryTask'
   * @returns {String} redis key
   */
   static constructRehydrateCompleteRedisKey (taskName) {
    return `${taskName}:::rehydrateComplete:::${new Date().toISOString().split('T')[0]}`
  }
  // add CID to set of CIDs that have been rehydrated today
  async addToRehydratedSet (taskName, CID) {
    await this.redis.sadd(this.constructRehydrateCompleteRedisKey(taskName), CID)
    await this.redis.expire(this.constructRehydrateCompleteRedisKey(taskName), 60 * 60 * 24) // expire one day after final write
  }

  // check if CID has been rehydrated today
  // return true if has been rehydrated
  async checkIfRehydratedToday (taskName, CID) {
    return this.redis.sismember(this.constructRedisKey(taskName), CID)
  }
}

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

    this.RehydrateRedisCounter = new RehydrateRedisCounter(redisClient)

    // Most errors in the rehydrate calls will be caught; this try/catch is to catch unexpected errors

    this.queue.process(PROCESS_NAMES.rehydrate_file, config.get('rehydrateMaxConcurrency'), async (job, done) => {
      const { multihash, storagePath, filename, logContext } = job.data

      this.logStatus(logContext, `Processing a rehydrateIpfsFromFsIfNecessary task for ${multihash}`)
      try {
        await rehydrateIpfsFromFsIfNecessary(multihash, storagePath, logContext, filename)
        this.RehydrateRedisCounter.addToRehydratedSet('rehydrateIpfsFromFsIfNecessary', multihash)
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
        this.RehydrateRedisCounter.addToRehydratedSet('rehydrateIpfsDirFromFsIfNecessary', multihash)
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
      
      // disable adding to queue if max queue count is greater than some threshold
      const count = await this.queue.count()
      if (count > MAX_COUNT) return

      // return early if we've rehydrated for this CID today
      const rehydrateDone = await this.RehydrateRedisCounter.checkIfRehydratedToday('addRehydrateIpfsFromFsIfNecessaryTask', multihash)
      if (rehydrateDone) return

      // if the min threshold for rehydrating this CID hasn't been met, return early
      const count = await this.RehydrateRedisCounter.incrementCount('addRehydrateIpfsFromFsIfNecessaryTask', multihash)
      if (count <= MIN_REHYDRATE_THRESHOLD) return

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

      // disable adding to queue if max queue count is greater than some threshold
      const count = await this.queue.count()
      if (count > MAX_COUNT) return

      // return early if we've rehydrated for this CID today
      const rehydrateDone = await this.RehydrateRedisCounter.checkIfRehydratedToday('addRehydrateIpfsFromFsIfNecessaryTask', multihash)
      if (rehydrateDone) return

      // if the min threshold for rehydrating this CID hasn't been met, return early
      const count = await this.RehydrateRedisCounter.incrementCount('addRehydrateIpfsFromFsIfNecessaryTask', multihash)
      if (count <= MIN_REHYDRATE_THRESHOLD) return

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
