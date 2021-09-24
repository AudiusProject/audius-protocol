const Bull = require('bull')
const Sequelize = require('sequelize')
const sessionManager = require('../sessionManager')
const config = require('../config')
const { logger } = require('../logging')
const { SessionToken } = require('../models')

const QUEUE_INTERVAL_MS = 60 * 1000 * 60 * 24 // daily run
const SESSION_EXPIRATION_AGE = 60 * 1000 * 60 * 24 * 14 // 2 weeks
const BATCH_COUNT = 100
const PROCESS_NAMES = Object.freeze({
  expire_sessions: 'expire_sessions'
})

/**
 * A persistent cron-style queue that periodically deletes expired session tokens from Redis cache and the database.
 *
 * The queue runs daily on cron.
 *
 */
class SessionExpirationQueue {
  constructor () {
    this.queue = new Bull(
      'session-expiration-queue',
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
    this.logStatus = this.logStatus.bind(this)
    this.expireSessions = this.expireSessions.bind(this)

    // Clean up anything that might be still stuck in the queue on restart
    this.queue.empty()

    this.queue.process(
      PROCESS_NAMES.expire_sessions,
      /* concurrency */ 1,
      async (job, done) => {
        try {
          this.logStatus('Starting')
          let progress = 0

          const SESSION_EXPIRED_CONDITION = {
            where: {
              created_at: {
                [Sequelize.Op.gt]: new Date(Date.now() - SESSION_EXPIRATION_AGE)
              }
            }
          }

          const numExpiredSessions = await SessionToken.count(SESSION_EXPIRED_CONDITION)
          this.logStatus(`${numExpiredSessions} expired sessions ready for deletion.`)

          let numRemainingSessionsToExpire = numExpiredSessions
          while (numRemainingSessionsToExpire > 0) {
            await this.expireSessions(SESSION_EXPIRED_CONDITION, BATCH_COUNT)
            progress += (BATCH_COUNT / numExpiredSessions) * 100
            job.progress(progress)
            numRemainingSessionsToExpire -= BATCH_COUNT
          }
          done(null, {})
        } catch (e) {
          this.logStatus(`Error ${e}`)
          done(e)
        }
      }
    )
  }

  async expireSessions (sessionExpiredCondition, batchCount) {
    const sessionsToDelete = await SessionToken.findAll(Object.assign(sessionExpiredCondition, { limit: batchCount }))
    await sessionManager.deleteSessions(sessionsToDelete)
  }

  /**
   * Logs a status message and includes current queue info
   * @param {string} message
   */
  async logStatus (message) {
    const { waiting, active, completed, failed, delayed } = await this.queue.getJobCounts()
    logger.info(`Session Expiration Queue: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `)
  }

  /**
   * Starts the session expiration queue on a daily cron.
   */
  async start () {
    try {
      // Run the job immediately
      await this.queue.add(PROCESS_NAMES.expire_sessions)

      // Then enqueue the job to run on a regular interval
      setInterval(async () => {
        try {
          await this.queue.add(PROCESS_NAMES.expire_sessions)
        } catch (e) {
          this.logStatus('Failed to enqueue!')
        }
      }, QUEUE_INTERVAL_MS)
    } catch (e) {
      this.logStatus('Startup failed!')
    }
  }
}

module.exports = SessionExpirationQueue
