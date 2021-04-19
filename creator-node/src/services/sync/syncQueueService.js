const Bull = require('bull')

const JobProcessorConcurrency = 10
const JobProcessorFnFilePath = `${__dirname}/syncQueueJobProcessor.js`

/**
 * SyncProcessingQueue - handles enqueuing and processing of Sync jobs on secondary
 */
class SyncProcessingQueue {
  constructor (nodeConfig) {
    this.nodeConfig = nodeConfig

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

    // TODO comment
    this.queue.process(
      JobProcessorConcurrency,
      JobProcessorFnFilePath
    )

    console.log(`SIDTEST SYNCPROCESSINGQUEUE COMPLETED INIT`)
  }

  async enqueueSync ({ walletPublicKeys, creatorNodeEndpoint }) {
    console.log(`SIDTEST SYNCPROCESSINGQUEUE ENQUEUESYNC`)
    // if (!serviceRegistry.syncQueueService) {
      
    // }
    const jobProps = { walletPublicKeys, creatorNodeEndpoint }
    const job = await this.queue.add(jobProps)
    return job
  }
}

module.exports = SyncProcessingQueue
