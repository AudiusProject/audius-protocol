const { Queue, Worker } = require('bullmq')

const redis = require('../redis')
const config = require('../config')
const {
  MONITORS,
  PROMETHEUS_MONITORS,
  getMonitorRedisKey
} = require('./monitors')
const { logger } = require('../logging')
const { clusterUtils } = require('../utils')

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
  constructor(prometheusRegistry) {
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

    this.prometheusRegistry = prometheusRegistry

    // Clean up anything that might be still stuck in the queue on restart and run once instantly
    if (clusterUtils.isThisWorkerInit()) {
      this.queue.drain(true)
      this.seedInitialValues()
    }
    if (clusterUtils.isThisWorkerSpecial()) {
      const worker = new Worker(
        'monitoring-queue',
        async (job) => {
          try {
            await this.logStatus('Starting')
  
            // Iterate over each monitor and set a new value if the cached
            // value is not fresh.
            Object.entries(MONITORS).forEach(
              async ([monitorKey, monitorProps]) => {
                try {
                  await this.refresh(monitorProps, monitorKey)
                } catch (e) {
                  this.logStatus(`Error on ${monitorProps.name} ${e}`)
                }
              }
            )
          } catch (e) {
            this.logStatus(`Error ${e}`)
          }
        },
        { connection }
      )
    }
  }

  /**
   * These values are used in the ensureStorageMiddleware. There could be a small chance of a timing race
   * where the values are undefined after init and we need to wait for them to be populated, so populate
   * them on init
   */
  async seedInitialValues() {
    await this.refresh(MONITORS.STORAGE_PATH_SIZE, 'STORAGE_PATH_SIZE')
    await this.refresh(MONITORS.STORAGE_PATH_USED, 'STORAGE_PATH_USED')
  }

  /**
   * Refresh monitor in redis and prometheus (if integer)
   * @param {Object} monitorProps Object containing the monitor props like { func, ttl, type, name }
   * @param {*} monitorKey name of the monitor eg `THIRTY_DAY_ROLLING_SYNC_SUCCESS_COUNT`
   */
  async refresh(monitorProps, monitorKey) {
    const key = getMonitorRedisKey(monitorProps)
    const ttlKey = `${key}:ttl`

    // If the value is fresh, exit early
    const isFresh = await redis.get(ttlKey)
    if (isFresh) return

    const value = await monitorProps.func()
    this.logStatus(`Computed value for ${monitorProps.name} ${value}`)

    // store integer monitors in prometheus
    try {
      if (PROMETHEUS_MONITORS.hasOwnProperty(monitorKey)) {
        const metric = this.prometheusRegistry.getMetric(
          this.prometheusRegistry.metricNames[`MONITOR_${monitorKey}`]
        )
        metric.set({}, value)
      }
    } catch (e) {
      logger.warn(
        `MonitoringQueue - Couldn't store value: ${value} in prometheus for metric: ${monitorKey} - ${e.message}`
      )
    }

    // Set the value
    await redis.set(key, value)

    if (monitorProps.ttl) {
      // Set a TTL (in seconds) key to track when this value needs refreshing.
      // We store a separate TTL key rather than expiring the value itself
      // so that in the case of an error, the current value can still be read
      await redis.set(ttlKey, 1, 'EX', monitorProps.ttl)
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
