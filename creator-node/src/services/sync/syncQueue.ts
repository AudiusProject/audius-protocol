import type { SpanContext } from '@opentelemetry/api'
import type { LogContext } from '../../utils'

import { Job, Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

import { clearActiveJobs } from '../../utils'
import { instrumentTracing, tracing } from '../../tracer'
import {
  logger,
  logInfoWithDuration,
  logErrorWithDuration,
  getStartTime
} from '../../logging'
import { secondarySyncFromPrimary } from './secondarySyncFromPrimary'
import { ForceResyncConfig } from '../../services/stateMachineManager/stateReconciliation/types'

const SYNC_QUEUE_HISTORY = 500

type EnqueueSyncArgs = {
  wallet: string
  creatorNodeEndpoint: string
  blockNumber: number
  forceResyncConfig: ForceResyncConfig
  forceWipe?: boolean
  syncOverride?: boolean
  logContext: LogContext
  parentSpanContext: SpanContext
  syncUuid: string | null
}

/**
 * SyncQueue - handles enqueuing and processing of Sync jobs on secondary
 * sync job = this node (secondary) will sync data for a user from their primary
 */
export class SyncQueue {
  nodeConfig: any
  redis?: Redis
  serviceRegistry: any
  queue?: Queue
  /**
   * Construct bull queue and define job processor
   * @notice - accepts `serviceRegistry` instance, even though this class is initialized
   *    in that serviceRegistry instance. A sub-optimal workaround for now.
   */
  async init(nodeConfig: any, redis: Redis, serviceRegistry: any) {
    this.nodeConfig = nodeConfig
    this.redis = redis
    this.serviceRegistry = serviceRegistry

    /**
     * TODO - set default value for host and port in nodeConfig, @see TcpSocketConnectOpts
     */
    const connection = {
      host: nodeConfig.get('redisHost'),
      port: nodeConfig.get('redisPort')
    } as any
    this.queue = new Queue('sync-processing-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: SYNC_QUEUE_HISTORY,
        removeOnFail: SYNC_QUEUE_HISTORY
      }
    })

    // any leftover active jobs need to be deleted when a new queue
    // is created since they'll never get processed
    await clearActiveJobs(this.queue, logger)

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
        concurrency: this.nodeConfig.get('syncQueueMaxConcurrency')
      }
    )
    const prometheusRegistry = serviceRegistry?.prometheusRegistry
    if (prometheusRegistry !== null && prometheusRegistry !== undefined) {
      prometheusRegistry.startQueueMetrics(this.queue, worker)
    }
  }

  private async processTask(job: Job) {
    const {
      wallet,
      creatorNodeEndpoint,
      forceResyncConfig,
      forceWipe,
      syncOverride,
      blockNumber,
      logContext,
      serviceRegistry,
      syncUuid
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
        syncOverride,
        logContext,
        syncUuid: syncUuid || null
      })
      logInfoWithDuration(
        { logger, startTime },
        `syncQueue - secondarySyncFromPrimary Success for wallet ${wallet} from primary ${creatorNodeEndpoint}`
      )
    } catch (e: any) {
      tracing.recordException(e)
      logErrorWithDuration(
        { logger, startTime },
        `syncQueue - secondarySyncFromPrimary Error - failure for wallet ${wallet} from primary ${creatorNodeEndpoint} - ${e.message}`
      )
      result = { error: e.message }
    }

    return result
  }

  public async enqueueSync({
    wallet,
    creatorNodeEndpoint,
    blockNumber,
    forceResyncConfig,
    forceWipe,
    syncOverride,
    logContext,
    parentSpanContext,
    syncUuid = null // Could be null for backwards compatibility
  }: EnqueueSyncArgs) {
    // safe null check assuming `init()` is called after constructor
    // (which it should be)
    const job = await this.queue!.add(
      'process-sync',
      {
        wallet,
        creatorNodeEndpoint,
        blockNumber,
        forceResyncConfig,
        forceWipe,
        syncOverride,
        logContext,
        parentSpanContext,
        syncUuid: syncUuid || null
      },
      { lifo: !!forceWipe }
    )
    return job
  }
}
