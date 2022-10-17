import {Job} from 'bullmq'
import { Queue, Worker } from 'bullmq'
import Sequelize from 'sequelize'

import {deleteSessions} from '../sessionManager'
const config = require('../config')
import { logger } from '../logging'
const { SessionToken } = require('../models')
import { clusterUtils } from '../utils'

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
    this.logStatus = this.logStatus.bind(this)
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

  async expireSessions (sessionExpiredCondition: Date){
    const sessionsToDelete = await SessionToken.findAll(
      Object.assign(sessionExpiredCondition, { limit: this.batchSize })
    )
    await sessionManager.deleteSessions(sessionsToDelete)
  }

  /**
   * Logs a status message and includes current queue info
   * @param {string} message
   */
  async logStatus(message: string) {
    const { waiting, active, completed, failed, delayed } =
      await this.queue.getJobCounts()
    logger.info(
      `Session Expiration Queue: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `
    )
  }

  /**
   * Starts the session expiration queue on a daily cron.
   */
  async start () {
    const connection = {
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }

    // Clean up anything that might be still stuck in the queue on restart
    if (clusterUtils.isThisWorkerInit()) {
      await this.queue.drain(true)
    }

    const worker = new Worker(
      'session-expiration-queue',
      async (job: Job) => {
        try {
          await this.logStatus('Starting')
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
          await this.logStatus(
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
          await this.logStatus(`Error ${e}`)
          return e
        }
      },
      { connection }
    )

    try {
      if (clusterUtils.isThisWorkerSpecial()) {
        // Run the job immediately
        await this.queue.add(PROCESS_NAMES.expire_sessions, {})

        // Then enqueue the job to run on a regular interval
        setInterval(async () => {
          try {
            await this.queue.add(PROCESS_NAMES.expire_sessions, {})
          } catch (e) {
            await this.logStatus('Failed to enqueue!')
          }
        }, this.runInterval)
      }
    } catch (e) {
      await this.logStatus('Startup failed!')
    }
  }
}