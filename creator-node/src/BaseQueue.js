// An abstract class that has graceful shutdown properties and
// other properties that a general queue should have

const Bull = require('bull')
const { timeout } = require('./utils')

const config = require('./config')
const { logger: genericLogger } = require('./logging')

class BaseQueue {
  constructor(name, defaultJobOptions = {}) {
    if (this.constructor === BaseQueue) {
      throw new Error("Abstract class BaseQueue can't be instantiated")
    }

    this.queue = new Bull(name, {
      redis: {
        host: config.get('redisHost'),
        port: config.get('redisPort')
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        ...defaultJobOptions
      }
    })

    this.name = name
  }

  /**
   * Wraps up currently processed jobs in the queue up to some timeout.
   * This used when the app is about to shut down, and the Content Node
   * attempts to gracefully shutdown.
   * @param {number} [maxTime=30000] number of ms to wait for queue to finish
   */
  async wrapUpJobs(maxTime = 30000) {
    const handleCurrentJobs = async () => {
      try {
        await this.getQueue.whenCurrentJobsFinished()
      } catch (e) {
        this.logWarn(`Could not wrap up jobs: ${e.message}`)
        return false
      }

      return true
    }

    const maxTimeout = async () => {
      await timeout(maxTime, false)
      return false
    }

    const wrappedUpJobs = await Promise.race([
      handleCurrentJobs(),
      maxTimeout()
    ])

    if (wrappedUpJobs) {
      this.logStatus('Successfully wrapped up remainder running jobs')
    } else {
      this.logWarn(
        `Could not wrap up jobs within ${maxTime}ms. Discarding remainder jobs..`
      )
    }
  }

  // Returns the queue
  getQueue() {
    return this.queue
  }

  /**
   * Gets all waiting, active, and failed jobs in the queue
   */
  async getJobs() {
    const queue = this.getQueue()

    const [waiting, active, failed] = await Promise.all([
      queue.getJobs(['waiting']),
      queue.getJobs(['active']),
      queue.getJobs(['failed'])
    ])

    const allTasks = {
      waiting: this.getTasks(waiting),
      active: this.getTasks(active),
      failed: this.getTasks(failed)
    }

    return allTasks
  }
}

module.exports = BaseQueue
