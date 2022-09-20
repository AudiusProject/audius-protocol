const { Queue, Worker } = require('bullmq')
const cluster = require('cluster')

const redis = require('../redis')
const config = require('../config')
const { MONITORS, getMonitorRedisKey } = require('./monitors')
const { logger } = require('../logging')

const QUEUE_INTERVAL_MS = 60 * 1000

const PROCESS_NAMES = Object.freeze({
  monitor: 'monitor'
})

const MONITORING_QUEUE_HISTORY = 500

/**
 * A persistent cron-style queue that periodically monitors various
 * health metrics and caches values in redis.
 *
 * The queue runs every minute on cron, but individual monitors establish
 * their own freshness/refresh rate to operate on.
 *  1. The queue spins up and for each monitor checks to see if it needs a refresh
 *  2. Refreshes the value and stores the update in redis
 */
class MonitoringQueue {
  constructor() {
    const connection = {
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }
    this.queue = new Queue('monitoring-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: MONITORING_QUEUE_HISTORY,
        removeOnFail: MONITORING_QUEUE_HISTORY
      }
    })

    // Clean up anything that might be still stuck in the queue on restart and run once instantly
    if (cluster.worker?.id === 1) {
      this.queue.drain()
      this.seedInitialValues()
    }

    const worker = new Worker(
      'monitoring-queue',
      async (job) => {
        try {
          this.logStatus('Starting')

          // Iterate over each monitor and set a new value if the cached
          // value is not fresh.
          Object.values(MONITORS).forEach(async (monitor) => {
            try {
              await this.refresh(monitor)
            } catch (e) {
              this.logStatus(`Error on ${monitor.name} ${e}`)
            }
          })
        } catch (e) {
          this.logStatus(`Error ${e}`)
        }
      },
      { connection }
    )
  }

  /**
   * These values are used in the ensureStorageMiddleware. There could be a small chance of a timing race
   * where the values are undefined after init and we need to wait for them to be populated, so populate
   * them on init
   */
  async seedInitialValues() {
    await this.refresh(MONITORS.STORAGE_PATH_SIZE)
    await this.refresh(MONITORS.STORAGE_PATH_USED)
  }

  async refresh(monitor) {
    const key = getMonitorRedisKey(monitor)
    const ttlKey = `${key}:ttl`

    // If the value is fresh, exit early
    const isFresh = await redis.get(ttlKey)
    if (isFresh) return

    const value = await monitor.func()
    this.logStatus(`Computed value for ${monitor.name} ${value}`)

    // Set the value
    redis.set(key, value)

    if (monitor.ttl) {
      // Set a TTL (in seconds) key to track when this value needs refreshing.
      // We store a separate TTL key rather than expiring the value itself
      // so that in the case of an error, the current value can still be read
      redis.set(ttlKey, 1, 'EX', monitor.ttl)
    }
  }

  /**
   * Logs a status message and includes current queue info
   * @param {string} message
   */
  async logStatus(message) {
    const { waiting, active, completed, failed, delayed } =
      await this.queue.getJobCounts()
    logger.info(
      `Monitoring Queue: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `
    )
  }

  /**
   * Starts the monitoring queue on an every minute cron.
   */
  async start() {
    try {
      // Run the job immediately
      await this.queue.add(PROCESS_NAMES.monitor, {})

      // Then enqueue the job to run on a regular interval
      setInterval(async () => {
        try {
          await this.queue.add(PROCESS_NAMES.monitor, {})
        } catch (e) {
          this.logStatus('Failed to enqueue!')
        }
      }, QUEUE_INTERVAL_MS)
    } catch (e) {
      this.logStatus('Startup failed!')
    }
  }
}

module.exports = MonitoringQueue
