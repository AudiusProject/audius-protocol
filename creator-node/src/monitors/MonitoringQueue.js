const Bull = require('bull')
const redis = require('../redis')
const config = require('../config')
const { logger } = require('../logging')
const { getDatabaseSize } = require('./database')

const MONITORING_REDIS_PREFIX = 'monitoring'
const PROCESS_NAMES = Object.freeze({
  monitor: 'monitor'
})

/**
 * List of all monitors to run, containing:
 *  @param {string} name A unique name (for caching in redis)
 *  @param {number} ttl TTL in seconds for how long a cached value is good for
 *  @param {function} func The actual work to compute a value. The return value is what is cached.
 */
const MONITORS = [
  {
    name: 'databaseSize',
    ttl: 120,
    func: getDatabaseSize
  },
  // TODO: Add more monitors
]

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
    this.queue = new Bull(
      'monitoring-queue',
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true
        }
      }
    )

    // Clean up anything that might be still stuck in the queue on restart
    this.queue.empty()

    this.queue.process(
      PROCESS_NAMES.monitor,
      /* concurrency */ 1,
      async (job, done) => {
        this.logStatus('Starting')

        // Iterate over each monitor and set a new value if the cached
        // value is not fresh.
        MONITORS.forEach(async monitor => {
          try {
            await this.setIfNotFresh(monitor)
          } catch (e) {
            this.logStatus(`Error on ${monitor.name} ${e}`)
          }
        })

        done(null, {})
      }
    )
  }

  async setIfNotFresh (monitor) {
    const key = `${MONITORING_REDIS_PREFIX}:${monitor.name}`
    const ttlKey = `${key}:ttl`
  
    // If the value is fresh, exit early
    const isFresh = await redis.get(ttlKey)
    if (isFresh) return
  
    const value = await monitor.func()
    this.logStatus(`Computed value for ${monitor.name} ${value}`)
    // Set the value
    redis.set(key, value)
    // Set a TTL key to track when this value needs refreshing.
    // We store a separate TTL key rather than expiring the value itself
    // so that in the case of an error, the current value can still be read
    redis.set(ttlKey, 1, 'EX', monitor.ttl)
  }

  /**
   * Logs a status message and includes current queue info
   * @param {string} message
   */
  async logStatus (message) {
    const { waiting, active, completed, failed, delayed } = await this.queue.getJobCounts()
    logger.info(`Monitoring Queue: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `)
  }

  /**
   * Starts the monitoring queue on an every minute cron.
   */
  start () {
    this.queue.add(PROCESS_NAMES.monitor, {}, { repeat: { cron: '* * * * *' }})
  }
}

module.exports = new MonitoringQueue()
