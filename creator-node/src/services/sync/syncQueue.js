const Bull = require('bull')

const { logger } = require('../../logging')
const secondarySyncFromPrimary = require('./secondarySyncFromPrimary')

const SYNC_QUEUE_HISTORY = 500

/**
 * SyncQueue - handles enqueuing and processing of Sync jobs on secondary
 * sync job = this node (secondary) will sync data for a user from their primary
 */
class SyncQueue {
  /**
   * Construct bull queue and define job processor
   * @notice - accepts `serviceRegistry` instance, even though this class is initialized
   *    in that serviceRegistry instance. A sub-optimal workaround for now.
   */
  constructor(nodeConfig, redis, serviceRegistry) {
    this.nodeConfig = nodeConfig
    this.redis = redis
    this.serviceRegistry = serviceRegistry

    this.queue = new Bull('sync-processing-queue', {
      redis: {
        host: this.nodeConfig.get('redisHost'),
        port: this.nodeConfig.get('redisPort')
      },
      defaultJobOptions: {
        removeOnComplete: SYNC_QUEUE_HISTORY,
        removeOnFail: SYNC_QUEUE_HISTORY
      }
    })

    /**
     * Queue will process tasks concurrently if provided a concurrency number, and will process all on
     *    main thread if provided an in-line job processor function; it will distribute across child processes
     *    if provided an absolute path to separate file containing job processor function.
     *    https://github.com/OptimalBits/bull/tree/013c51942e559517c57a117c27a550a0fb583aa8#separate-processes
     *
     * @dev TODO - consider recording failures in redis
     */
    const jobProcessorConcurrency = this.nodeConfig.get(
      'syncQueueMaxConcurrency'
    )
    this.queue.process(jobProcessorConcurrency, async (job, done) => {
      const { wallet, creatorNodeEndpoint, blockNumber, forceResyncConfig } =
        job.data

      try {
        await secondarySyncFromPrimary({
          serviceRegistry: this.serviceRegistry,
          wallet,
          primaryEndpoint: creatorNodeEndpoint,
          blockNumber,
          forceResyncConfig: {
            ...forceResyncConfig,
            libs: serviceRegistry.libs
          }
        })
      } catch (e) {
        logger.error(
          `secondarySyncFromPrimary failure for wallet ${wallet} against ${creatorNodeEndpoint}`,
          e.message
        )
      }

      done()
    })
  }

  async enqueueSync(params) {
    const { wallet, creatorNodeEndpoint, blockNumber, forceResyncConfig } =
      params
    const job = await this.queue.add({
      wallet,
      creatorNodeEndpoint,
      blockNumber,
      forceResyncConfig
    })
    return job
  }
}

module.exports = SyncQueue
