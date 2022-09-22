const { Queue, Worker } = require('bullmq')

const { clusterUtils } = require('../../utils')
const { instrumentTracing, tracing } = require('../../tracer')
const {
  logger,
  logInfoWithDuration,
  logErrorWithDuration,
  getStartTime
} = require('../../logging')
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

    const connection = {
      host: nodeConfig.get('redisHost'),
      port: nodeConfig.get('redisPort')
    }
    this.queue = new Queue('sync-processing-queue', {
      connection,
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
    const worker = new Worker(
      'sync-processing-queue',
      async (job) => {
        const { parentSpanContext } = job.data
        const untracedProcessTask = this.processTask
        const processTask = instrumentTracing({
          name: 'syncQueue.process',
          fn: untracedProcessTask,
          options: {
            links: parentSpanContext
              ? [
                  {
                    context: parentSpanContext
                  }
                ]
              : [],
            attributes: {
              [tracing.CODE_FILEPATH]: __filename
            }
          }
        })

        // `processTask()` on longer has access to `this` after going through the tracing wrapper
        // so to mitigate that, we're manually adding `this.serviceRegistry` to the job data
        job.data = { ...job.data, serviceRegistry: this.serviceRegistry }
        return await processTask(job)
      },
      {
        connection,
        concurrency: clusterUtils.getConcurrencyPerWorker(
          this.nodeConfig.get('syncQueueMaxConcurrency')
        )
      }
    )
  }

  async processTask(job) {
    const {
      wallet,
      creatorNodeEndpoint,
      forceResyncConfig,
      forceWipe,
      blockNumber,
      logContext,
      serviceRegistry
    } = job.data

    let result = {}
    const startTime = getStartTime()
    try {
      result = await secondarySyncFromPrimary({
        serviceRegistry,
        wallet,
        creatorNodeEndpoint,
        blockNumber,
        forceResyncConfig,
        forceWipe,
        logContext
      })
      logInfoWithDuration(
        { logger, startTime },
        `syncQueue - secondarySyncFromPrimary Success for wallet ${wallet} from primary ${creatorNodeEndpoint}`
      )
    } catch (e) {
      tracing.recordException(e)
      logErrorWithDuration(
        { logger, startTime },
        `syncQueue - secondarySyncFromPrimary Error - failure for wallet ${wallet} from primary ${creatorNodeEndpoint} - ${e.message}`
      )
      result = { error: e.message }
    }

    return result
  }

  async enqueueSync({
    wallet,
    creatorNodeEndpoint,
    blockNumber,
    forceResyncConfig,
    forceWipe,
    logContext,
    parentSpanContext
  }) {
    const job = await this.queue.add('process-sync', {
      wallet,
      creatorNodeEndpoint,
      blockNumber,
      forceResyncConfig,
      forceWipe,
      logContext,
      parentSpanContext
    })
    return job
  }
}

module.exports = SyncQueue
