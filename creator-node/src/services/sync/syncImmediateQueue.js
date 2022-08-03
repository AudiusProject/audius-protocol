const Bull = require('bull')

const { logger } = require('../../logging')
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
        lockDuration: LOCK_DURATION
      }
    })

    const jobProcessorConcurrency = this.nodeConfig.get(
      'syncQueueMaxConcurrency'
    )
    this.queue.process(jobProcessorConcurrency, async (job, done) => {
      const { walletPublicKeys, creatorNodeEndpoint, forceResync } = job.data

      try {
        await secondarySyncFromPrimary(
          this.serviceRegistry,
          walletPublicKeys,
          creatorNodeEndpoint,
          null, // blockNumber
          forceResync
        )
      } catch (e) {
        logger.error(
          `secondarySyncFromPrimary failure for wallets ${walletPublicKeys} against ${creatorNodeEndpoint}`,
          e.message
        )
      }

      done()
    })
  }

  async processImmediateSync({
    walletPublicKeys,
    creatorNodeEndpoint,
    forceResync
  }) {
    const jobProps = { walletPublicKeys, creatorNodeEndpoint, forceResync }
    const job = await this.queue.add(jobProps)
    const result = await job.finished()
    return result
  }
}

module.exports = SyncImmediateQueue
