const Bull = require('bull')

const { logger } = require('../../logging')
const processSync = require('./processSync')

// TODO move to envvar + document
const JobProcessorConcurrency = 50

/**
 * SyncQueue - handles enqueuing and processing of Sync jobs on secondary
 * sync job = this node (secondary) will sync data for a user from their primary
 */
class SyncQueue {
  /**
   * Construct bull queue and define job processor
   */
  constructor (nodeConfig, redis, ipfs, ipfsLatest, serviceRegistry) {
    this.nodeConfig = nodeConfig
    this.redis = redis
    this.ipfs = ipfs
    this.ipfsLatest = ipfsLatest
    this.serviceRegistry = serviceRegistry

    this.queue = new Bull(
      'sync-processing-queue',
      {
        redis: {
          host: this.nodeConfig.get('redisHost'),
          port: this.nodeConfig.get('redisPort')
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true
        }
      }
    )

    /**
     * Queue will process tasks concurrently if provided a concurrency number, and will process all on
     *    main thread if provided an in-line job processor function; it will distribute across child processes
     *    if provided an absolute path to separate file containing job processor function.
     *    https://github.com/OptimalBits/bull/tree/013c51942e559517c57a117c27a550a0fb583aa8#separate-processes
     *
     * @dev TODO - consider recording failures in redis
     */
    this.queue.process(
      JobProcessorConcurrency,
      async (job, done) => {
        const { walletPublicKeys, creatorNodeEndpoint } = job.data

        try {
          await processSync(this.serviceRegistry, walletPublicKeys, creatorNodeEndpoint)
        } catch (e) {
          logger.error(`processSync failure for wallets ${walletPublicKeys} against ${creatorNodeEndpoint}`, e.message)
        }

        done()
      }
    )
  }

  async enqueueSync ({ walletPublicKeys, creatorNodeEndpoint }) {
    const jobProps = { walletPublicKeys, creatorNodeEndpoint }
    const job = await this.queue.add(jobProps)
    return job
  }
}

module.exports = SyncQueue
