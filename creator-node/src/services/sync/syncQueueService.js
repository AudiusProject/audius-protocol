const Bull = require('bull')

// const JobProcessorConcurrency = 10
// const JobProcessorFnFilePath = `${__dirname}/syncQueueJobProcessor.js`

// const serviceRegistry = require('../../serviceRegistry')
const _processSync = require('./syncQueueJobProcessor')

/**
 * SyncProcessingQueue - handles enqueuing and processing of Sync jobs on secondary
 */
class SyncProcessingQueue {
  constructor (nodeConfig, redis, ipfs, ipfsLatest) {
    this.nodeConfig = nodeConfig
    this.redis = redis
    this.ipfs = ipfs
    this.ipfsLatest = ipfsLatest
    console.log(`SIDTEST SYNCPROCESSINGQUEUE INIT ${Object.keys(this.nodeConfig)}`)
    console.log(`SIDTEST SYNCPROCESSINGQUEUE INIT ${Object.keys(this.redis)}`)
    console.log(`SIDTEST SYNCPROCESSINGQUEUE INIT ${Object.keys(this.ipfs)}`)
    console.log(`SIDTEST SYNCPROCESSINGQUEUE INIT ${Object.keys(this.ipfsLatest)}`)

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
    // this.queue.process(
    //   JobProcessorConcurrency,
    //   JobProcessorFnFilePath
    // )
    this.queue.process(this.syncQueueJobProcessorFn)
    console.log(`SIDTEST SYNCPROCESSINGQUEUE COMPLETED INIT`)
  }

  async enqueueSync ({ walletPublicKeys, creatorNodeEndpoint }) {
    console.log(`SIDTEST SYNCPROCESSINGQUEUE ENQUEUESYNC ${Object.keys(this.nodeConfig)}`)
    console.log(`SIDTEST SYNCPROCESSINGQUEUE ENQUEUESYNC ${Object.keys(this.redis)}`)
    console.log(`SIDTEST SYNCPROCESSINGQUEUE ENQUEUESYNC ${Object.keys(this.ipfs)}`)
    console.log(`SIDTEST SYNCPROCESSINGQUEUE ENQUEUESYNC ${Object.keys(this.ipfsLatest)}`)

    const jobProps = { walletPublicKeys, creatorNodeEndpoint, services: {
      nodeConfig: this.nodeConfig,
      redis: this.redis,
      ipfs: this.ipfs,
      ipfsLatest: this.ipfsLatest
    } }
    const job = await this.queue.add(jobProps)
    return job
  }

  /**
   * cannot access class context this since it is called potentially in a different process eg must be a pure function
   */
  async syncQueueJobProcessorFn (job) {
    const { walletPublicKeys, creatorNodeEndpoint, services } = job.data
    const { nodeConfig, redis, ipfs, ipfsLatest } = services

    try {
      console.log(`SIDTEST SYNCQUEUESERVICE SYNCQUEUEPROCESSORFN ${Object.keys(services.nodeConfig)}`)

      await _processSync(nodeConfig, redis, ipfs, ipfsLatest, walletPublicKeys, creatorNodeEndpoint)
    } catch (e) {
      console.log(`SIDTEST SYNCQUEUEJOBPROCESSORFN E`, e.message)
    }
  }
}

module.exports = SyncProcessingQueue
