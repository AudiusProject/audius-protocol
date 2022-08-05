const PrometheusRegistry = require('../../src/services/prometheusMonitoring/prometheusRegistry')
const Bull = require('bull')

const config = require('../../src/config')

// Mock monitoring queue that sets monitor values on construction
class GenericBullQueue {
  constructor() {
    this.queue = Bull('genericBullQueue', {
      redis: {
        host: config.get('redisHost'),
        port: config.get('redisPort')
      },
      defaultJobOptions: {
        removeOnComplete: 0,
        removeOnFail: 0
      }
    })
    const prometheusRegistry = new PrometheusRegistry()
    prometheusRegistry.startQueueMetrics(this.queue)

    this.queue.process(1, async (job) => {
      const { timeout } = job.data
      if (timeout) {
        console.log(`waiting ${timeout}`)
        setTimeout(() => console.log(`done ${timeout}`), timeout)
      }
    })
  }

  async addTask(params) {
    const job = await this.queue.add(params)

    return job
  }
}

module.exports = GenericBullQueue
