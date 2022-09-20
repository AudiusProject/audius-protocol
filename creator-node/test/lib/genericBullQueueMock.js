const PrometheusRegistry = require('../../src/services/prometheusMonitoring/prometheusRegistry')
const { Queue, Worker } = require('bullmq')

const config = require('../../src/config')

// Mock monitoring queue that sets monitor values on construction
class GenericBullQueue {
  constructor() {
    const connection = {
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }
    this.queue = new Queue('genericBullQueue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 0,
        removeOnFail: 0
      }
    })
    const prometheusRegistry = new PrometheusRegistry()

    const worker = new Worker(
      'genericBullQueue',
      async (job) => {
        const { timeout } = job.data
        if (timeout) {
          console.log(`waiting ${timeout}`)
          setTimeout(() => console.log(`done ${timeout}`), timeout)
        }
      },
      { connection }
    )

    prometheusRegistry.startQueueMetrics(this.queue, worker)
  }

  async addTask(params) {
    const job = await this.queue.add('mock-job', params)

    return job
  }
}

module.exports = GenericBullQueue
