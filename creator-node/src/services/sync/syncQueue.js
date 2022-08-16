const Bull = require('bull')

const { SemanticAttributes } = require('@opentelemetry/semantic-conventions')
const { SpanStatusCode } = require('@opentelemetry/api')
const { getTracer } = require('../../tracer')

const { logger } = require('../../logging')
const secondarySyncFromPrimary = require('./secondarySyncFromPrimary')
const { instrumentTracing } = require('utils/tracing')

const SYNC_QUEUE_HISTORY = 500
const LOCK_DURATION = 1000 * 60 * 30 // 30 minutes

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
      },
      settings: {
        lockDuration: LOCK_DURATION,
        // We never want to re-process stalled jobs
        maxStalledCount: 0
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
    this.queue.process(jobProcessorConcurrency, async (job) => {
      const {
<<<<<<< HEAD
        parentSpanContext
=======
        wallet,
        creatorNodeEndpoint,
        forceResyncConfig,
        blockNumber,
        logContext
>>>>>>> master
      } = job.data

      const processTask = instrumentTracing({
        name: 'syncQueue.process',
        fn: this.processTask,
        options: {
          links: [
            {
              context: parentSpanContext
            }
          ],
          attributes: {
            [SemanticAttributes.CODE_FILEPATH]: __filename
          }
        }
      })

      return await processTask(job)
    })

    processTask = async (job) => {
      const {
        walletPublicKeys,
        creatorNodeEndpoint,
        forceResync,
      } = job.data

      let result
      try {
        result = await secondarySyncFromPrimary({
          serviceRegistry: this.serviceRegistry,
          wallet,
          creatorNodeEndpoint,
          blockNumber,
          forceResyncConfig,
          logContext
        })
      } catch (e) {
        span.recordException(e)
        span.setStatus({ code: SpanStatusCode.ERROR })
        logger.error(
          `secondarySyncFromPrimary failure for wallet ${wallet} against ${creatorNodeEndpoint}`,
          e.message
        )
        result = { error: e.message }
      }

      return result
    }
  }

  async enqueueSync({
<<<<<<< HEAD
    walletPublicKeys,
    creatorNodeEndpoint,
    forceResync,
    parentSpanContext
  }) {
    const jobProps = {
      walletPublicKeys,
      creatorNodeEndpoint,
      forceResync,
      parentSpanContext
    }
    const job = await this.queue.add(jobProps)
=======
    wallet,
    creatorNodeEndpoint,
    blockNumber,
    forceResyncConfig,
    logContext
  }) {
    const job = await this.queue.add({
      wallet,
      creatorNodeEndpoint,
      blockNumber,
      forceResyncConfig,
      logContext
    })
>>>>>>> master
    return job
  }
}

module.exports = SyncQueue
