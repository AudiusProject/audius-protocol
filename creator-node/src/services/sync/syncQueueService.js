/**
 *
 */

const Bull = require('bull')

const JobProcessorConcurrency = 10
const JobProcessorFnFilePath = `${__dirname}/syncQueueJobProcessor.js`

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
  }

  async enqueueSync ({ walletPublicKeys, creatorNodeEndpoint, serviceRegistry }) {
    const jobProps = { walletPublicKeys, creatorNodeEndpoint, serviceRegistry }
    const job = await this.queue.add(jobProps)
    return job
  }
}

module.exports = SyncProcessingQueue
