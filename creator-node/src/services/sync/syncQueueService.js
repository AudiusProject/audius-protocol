const Bull = require('bull')

const JobProcessorConcurrency = 10
const JobProcessorFnFilePath = `${__dirname}/syncQueueJobProcessor.js`

/**
 * SyncProcessingQueue - handles enqueuing and processing of Sync jobs on secondary
 */
class SyncProcessingQueue {
  /**
   * TODO better comment
   */
  constructor (nodeConfig, redis, ipfs, ipfsLatest) {
    this.nodeConfig = nodeConfig
    this.redis = redis
    this.ipfs = ipfs
    this.ipfsLatest = ipfsLatest

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
       * Queue will process tasks concurrently if provided a concurrency number and an absolute
       *    path to file containing job processor function
       * https://github.com/OptimalBits/bull/tree/013c51942e559517c57a117c27a550a0fb583aa8#separate-processes
       */
    this.queue.process(
      JobProcessorConcurrency,
      JobProcessorFnFilePath
    )

    console.log(`SIDTEST SYNCPROCESSINGQUEUE COMPLETED INIT`)
  }

  async enqueueSync ({ walletPublicKeys, creatorNodeEndpoint }) {
    const jobProps = { walletPublicKeys, creatorNodeEndpoint }
    const job = await this.queue.add(jobProps)
    return job
  }
}

module.exports = SyncProcessingQueue
