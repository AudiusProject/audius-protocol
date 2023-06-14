import { Job, Queue, Worker } from 'bullmq'
import Sequelize from 'sequelize'

import { deleteSessions } from '../sessionManager'
import { logger } from '../logging'
import { clearActiveJobs } from '../utils'
const config = require('../config')
const { SessionToken } = require('../models')

const RUN_INTERVAL = 60 * 1000 * 60 * 24 // daily run
const SESSION_EXPIRATION_AGE = 60 * 1000 * 60 * 24 * 14 // 2 weeks
const BATCH_SIZE = 100
const PROCESS_NAMES = Object.freeze({
  expire_sessions: 'expire_sessions'
})

/**
 * A persistent cron-style queue that periodically deletes expired session tokens from Redis cache and the database. Runs on startup, deleting 100 sessions at a time, and then runs daily to clear sessions older than 14d.
 *
 */
export class SessionExpirationQueue {
  sessionExpirationAge: number
  batchSize: number
  runInterval: number
  queue: Queue

  constructor() {
    this.sessionExpirationAge = SESSION_EXPIRATION_AGE
    this.batchSize = BATCH_SIZE
    this.runInterval = RUN_INTERVAL
    this._logStatus = this._logStatus.bind(this)
    this.expireSessions = this.expireSessions.bind(this)
    const connection = {
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }
    this.queue = new Queue('session-expiration-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true
      }
    })
  }

  async expireSessions(sessionExpiredCondition: Object) {
    const sessionsToDelete = await SessionToken.findAll(
      Object.assign(sessionExpiredCondition, { limit: this.batchSize })
    )
    await deleteSessions(sessionsToDelete)
  }

  _logStatus(message: string) {
    logger.info(`Session Expiration Queue: ${message}`)
  }

  /**
   * Starts the session expiration queue on a daily cron.
   */
  async start() {
    const connection = {
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }

    // Clean up anything that might be still stuck in the queue on restart
    await this.queue.obliterate({ force: true })
    await clearActiveJobs(this.queue, logger)

    const _worker = new Worker(
      'session-expiration-queue',
      async (job: Job) => {
        try {
          this._logStatus('Starting')
          let progress = 0
          const SESSION_EXPIRED_CONDITION = {
            where: {
              createdAt: {
                [Sequelize.Op.gt]: new Date(
                  Date.now() - this.sessionExpirationAge
                )
              }
            }
          }
          const numExpiredSessions = await SessionToken.count(
            SESSION_EXPIRED_CONDITION
          )
          this._logStatus(
            `${numExpiredSessions} expired sessions ready for deletion.`
          )

          let sessionsToDelete = numExpiredSessions
          while (sessionsToDelete > 0) {
            await this.expireSessions(SESSION_EXPIRED_CONDITION)
            progress += (this.batchSize / numExpiredSessions) * 100
            job.updateProgress(progress)
            sessionsToDelete -= this.batchSize
          }
          return {}
        } catch (e) {
          this._logStatus(`Error ${e}`)
          return e
        }
      },
      { connection }
    )

    try {
      // Run the job immediately
      await this.queue.add(PROCESS_NAMES.expire_sessions, {})

      // Then enqueue the job to run on a regular interval
      setInterval(async () => {
        try {
          await this.queue.add(PROCESS_NAMES.expire_sessions, {})
        } catch (e) {
          this._logStatus('Failed to enqueue!')
        }
      }, this.runInterval)
    } catch (e) {
      this._logStatus('Startup failed!')
    }
  }
}
