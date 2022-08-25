const Bull = require('bull')

const {
  logger,
  logInfoWithDuration,
  logErrorWithDuration
} = require('../../logging')
const secondarySyncFromPrimary = require('./secondarySyncFromPrimary')

const SYNC_QUEUE_HISTORY = 500
const LOCK_DURATION = 1000 * 60 * 5 // 5 minutes

/**
 * SyncImmediateQueue - handles enqueuing and processing of immediate manual Sync jobs on secondary
 * sync job = this node (secondary) will sync data for a user from their primary
 * this queue is only for manual immediate syncs which are awaited until they're finished, for regular
 * syncs look at SyncQueue
 */
class SyncImmediateQueue {
  /**
   * Construct bull queue and define job processor
   * @notice - accepts `serviceRegistry` instance, even though this class is initialized
   *    in that serviceRegistry instance. A sub-optimal workaround for now.
   */
  constructor(nodeConfig, redis, serviceRegistry) {
    this.nodeConfig = nodeConfig
    this.redis = redis
    this.serviceRegistry = serviceRegistry

    this.queue = new Bull('sync-immediate-processing-queue', {
      redis: {
        host: this.nodeConfig.get('redisHost'),
        port: this.nodeConfig.get('redisPort')
      },
      defaultJobOptions: {
        removeOnComplete: SYNC_QUEUE_HISTORY,
        removeOnFail: SYNC_QUEUE_HISTORY
      },
      settings: {
        lockDuration: LOCK_DURATION,
        // We never want to re-process stalled jobs
        maxStalledCount: 0
      }
    })

    const jobProcessorConcurrency = this.nodeConfig.get(
      'syncQueueMaxConcurrency'
    )
    this.queue.process(jobProcessorConcurrency, async (job) => {
      const { wallet, creatorNodeEndpoint, forceResyncConfig, logContext } =
        job.data

      const startTime = Date.now()
      try {
        await secondarySyncFromPrimary({
          serviceRegistry: this.serviceRegistry,
          wallet,
          creatorNodeEndpoint,
          forceResyncConfig,
          logContext
        })
        logInfoWithDuration(
          { logger, startTime },
          `syncImmediateQueue - secondarySyncFromPrimary Success for wallet ${wallet} from primary ${creatorNodeEndpoint}`
        )
      } catch (e) {
        logErrorWithDuration(
          { logger, startTime },
          `syncImmediateQueue - secondarySyncFromPrimary Error - failure for wallet ${wallet} from primary ${creatorNodeEndpoint} - ${e.message}`
        )
        throw e
      }
    })
  }

  /**
   * Process a manual sync with immediate: true. This holds the promise open until the job finishes processing and returns the result.
   * It does not return the promise once the job has been added to the queue unlike other queues.
   */
  async processManualImmediateSync({
    wallet,
    creatorNodeEndpoint,
    forceResyncConfig,
    logContext
  }) {
    const job = await this.queue.add({
      wallet,
      creatorNodeEndpoint,
      forceResyncConfig,
      logContext
    })
    const result = await job.finished()
    return result
  }
}

module.exports = SyncImmediateQueue
