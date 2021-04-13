/**
 * 
 */

const Bull = require("bull")

const JobProcessorName = 'asdf'
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

    this.queue.process(
      JobProcessorName,
      JobProcessorConcurrency,
      JobProcessorFnFilePath
    )
  }

  async enqueueSync ({ walletPublicKeys, creatorNodeEndpoint }) {
    const jobProps = { walletPublicKeys, creatorNodeEndpoint }
    const job = await this.queue.add(jobProps)

    return job
  }
}

module.exports = SyncProcessingQueue