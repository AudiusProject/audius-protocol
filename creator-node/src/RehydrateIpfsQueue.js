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
const MIN_REHYDRATE_THRESHOLD = 10
const MAX_COUNT = 10000

const REHYDRATE_FILE_TASK_TYPE = `rehydrateIpfsFromFsIfNecessary`
const REHYDRATE_DIR_TASK_TYPE = 'rehydrateIpfsDirFromFsIfNecessary'

class RehydrateRedisCounter {
  constructor (redis) {
    this.redis = redis
  }

  /**
   * A redis key that stores hash of CID -> count and is incremented when we get a request for the CID
   * A new key is created for each day and is automatically deleted 24 hours after the final write
   * @param {String} taskType type of rehydrate task eg 'addRehydrateIpfsFromFsIfNecessaryTask' or 'addRehydrateIpfsDirFromFsIfNecessaryTask'
   * @returns {String} redis key
   */
  static constructCounterRedisKey (taskType) {
    return `${taskType}:::counter:::${new Date().toISOString().split('T')[0]}`
  }

  // keep count in redis for the number of times rehydrate is requested for each CID
  async incrementCount (taskType, CID) {
    const taskTypeKey = RehydrateRedisCounter.constructCounterRedisKey(taskType)
    const count = await this.redis.hincrby(taskTypeKey, CID, 1)
    await this.redis.expire(taskTypeKey, 60 * 60 * 24) // expire one day after final write
    return count
  }

  /**
   * A redis key that stores a set of CID's that have been rehydrated that day
   * A new key is created for each day and is automatically deleted 24 hours after the final write
   * @param {String} taskType type of rehydrate task eg 'addRehydrateIpfsFromFsIfNecessaryTask' or 'addRehydrateIpfsDirFromFsIfNecessaryTask'
   * @returns {String} redis key
   */
  static constructRehydrateCompleteRedisKey (taskType) {
    return `${taskType}:::rehydrateComplete:::${new Date().toISOString().split('T')[0]}`
  }

  // add CID to set of CIDs that have been rehydrated today
  async addToRehydratedSet (taskType, CID) {
    const taskTypeKey = RehydrateRedisCounter.constructRehydrateCompleteRedisKey(taskType)
    await this.redis.sadd(taskTypeKey, CID)
    await this.redis.expire(taskTypeKey, 60 * 60 * 24) // expire one day after final write
  }

  // check if CID has been rehydrated today
  // return true if has been rehydrated
  async checkIfRehydratedToday (taskType, CID) {
    const rehydratedToday = await this.redis.sismember(RehydrateRedisCounter.constructRehydrateCompleteRedisKey(taskType), CID)
    return !!rehydratedToday
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

      this.logStatus(logContext, `Processing a ${REHYDRATE_FILE_TASK_TYPE} task for ${multihash}`)
      try {
        await rehydrateIpfsFromFsIfNecessary(multihash, storagePath, logContext, filename)
        await this.RehydrateRedisCounter.addToRehydratedSet(REHYDRATE_FILE_TASK_TYPE, multihash)
        done()
      } catch (e) {
        this.logError(logContext, `Problem with processing a ${REHYDRATE_FILE_TASK_TYPE} task for ${multihash}: ${e}`)
        done(e)
      }
    })

    this.queue.process(PROCESS_NAMES.rehydrate_dir, config.get('rehydrateMaxConcurrency'), async (job, done) => {
      const { multihash, logContext } = job.data
      this.logStatus(logContext, `Processing a ${REHYDRATE_DIR_TASK_TYPE} task for ${multihash}`)
      try {
        await rehydrateIpfsDirFromFsIfNecessary(multihash, logContext)
        await this.RehydrateRedisCounter.addToRehydratedSet(REHYDRATE_DIR_TASK_TYPE, multihash)
        done()
      } catch (e) {
        this.logError(logContext, `Problem with processing a ${REHYDRATE_DIR_TASK_TYPE} task for ${multihash}: ${e}`)
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
      // disable adding to queue if max queue count is greater than some threshold
      const count = await this.queue.count()
      if (count > MAX_COUNT) {
        this.logStatus(logContext, `Attempted to add a ${REHYDRATE_FILE_TASK_TYPE} task to the queue, but the queue was full. CID: ${multihash}`)
        return
      }

      // return early if we've rehydrated for this CID today
      const rehydrateDone = await this.RehydrateRedisCounter.checkIfRehydratedToday(REHYDRATE_FILE_TASK_TYPE, multihash)
      if (rehydrateDone) {
        this.logStatus(logContext, `Attempted to add a ${REHYDRATE_FILE_TASK_TYPE} task to the queue, but rehydrate already ran today. CID: ${multihash}`)
        return
      }

      // if the min threshold for rehydrating this CID hasn't been met, return early
      const cidCount = await this.RehydrateRedisCounter.incrementCount(REHYDRATE_FILE_TASK_TYPE, multihash)
      if (cidCount < MIN_REHYDRATE_THRESHOLD) {
        this.logStatus(logContext, `Attempted to add a ${REHYDRATE_FILE_TASK_TYPE} task to the queue, current count to threshold ${cidCount}/${MIN_REHYDRATE_THRESHOLD}. CID: ${multihash}`)
        return
      }

      const job = await this.queue.add(
        PROCESS_NAMES.rehydrate_file,
        { multihash, storagePath, filename, logContext }
      )
      this.logStatus(logContext, `Successfully added a ${REHYDRATE_FILE_TASK_TYPE} task! CID: ${multihash}`)

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
      this.logStatus(logContext, `Attempting to add a ${REHYDRATE_DIR_TASK_TYPE} task to the queue! CID: ${multihash}`)

      // disable adding to queue if max queue count is greater than some threshold
      const count = await this.queue.count()
      if (count > MAX_COUNT) {
        this.logStatus(logContext, `Attempted to add a ${REHYDRATE_DIR_TASK_TYPE} task to the queue, but the queue was full. CID: ${multihash}`)
        return
      }

      // return early if we've rehydrated for this CID today
      const rehydrateDone = await this.RehydrateRedisCounter.checkIfRehydratedToday(REHYDRATE_DIR_TASK_TYPE, multihash)
      if (rehydrateDone) {
        this.logStatus(logContext, `Attempted to add a ${REHYDRATE_DIR_TASK_TYPE} task to the queue, but rehydrate already ran today. CID: ${multihash}`)
        return
      }

      // if the min threshold for rehydrating this CID hasn't been met, return early
      const cidCount = await this.RehydrateRedisCounter.incrementCount(REHYDRATE_DIR_TASK_TYPE, multihash)
      if (cidCount < MIN_REHYDRATE_THRESHOLD) {
        this.logStatus(logContext, `Attempted to add a ${REHYDRATE_DIR_TASK_TYPE} task to the queue, current count to threshold ${cidCount}/${MIN_REHYDRATE_THRESHOLD}. CID: ${multihash}`)
        return
      }

      const job = await this.queue.add(
        PROCESS_NAMES.rehydrate_dir,
        { multihash, logContext }
      )
      this.logStatus(logContext, `Successfully added a ${REHYDRATE_DIR_TASK_TYPE} task! CID: ${multihash}`)

      return job
    }
  }
}

module.exports = new RehydrateIpfsQueue()
