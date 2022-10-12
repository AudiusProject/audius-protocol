import { Queue, Worker } from 'bullmq'
import config from '../config'
import { logger } from '../logging'
import { setPremiumContentCIDCache } from './helpers'
import { clusterUtils } from '../utils'

const models = require('../models')
const { QueryTypes } = require('sequelize')

const QUEUE_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours
const PREMIUM_CONTENT_QUEUE_HISTORY = 500
const QUEUE_NAME = 'premium-content-queue'
const PROCESS_NAME = 'premium-content'

/**
 * A persistent cron-style queue that periodically refreshes
 * the premium content CIDs and their corresponding track ids.
 */
export class PremiumContentQueue {
  queue: Queue

  constructor() {
    const connection = {
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }
    this.queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: PREMIUM_CONTENT_QUEUE_HISTORY,
        removeOnFail: PREMIUM_CONTENT_QUEUE_HISTORY
      }
    })

    // Clean up anything that might be still stuck in the queue on restart and run once instantly
    if (clusterUtils.isThisWorkerInit()) {
      this.queue.drain(true)
    }

    if (clusterUtils.isThisWorkerSpecial()) {
      const worker = new Worker(
        QUEUE_NAME,
        async (_) => {
          await this.logStatus('Starting')
          try {
            const premiumContentCIDMap = await this.getPremiumContentCIDMap()
            await setPremiumContentCIDCache({
              cacheMap: premiumContentCIDMap,
              logger
            })
          } catch (e) {
            this.logStatus(
              `Error in premium content worker: ${(e as Error).message}`
            )
          }
        },
        { connection }
      )
    }
  }

  /**
   * Joins the "Tracks" and "Files" tables on track ids and sees if the
   * corresponding track is premium.
   * Returns map of these premium CIDs to their corresponding track ids.
   */
  async getPremiumContentCIDMap() {
    const result = await models.sequelize.query(
      `with premium as (
        select "blockchainId"
          from "Tracks"
          where ("metadataJSON" ->> 'is_premium')::text = 'true'
      ), non_premium as (
        select "blockchainId"
          from "Tracks"
          where ("metadataJSON" ->> 'is_premium')::text != 'true'
      ), cid_non_premium as (
        select f."multihash"
          from "Files" f join non_premium
          on f."trackBlockchainId" = non_premium."blockchainId"
          group by "multihash"
      )
      select premium.*, f."multihash"
        from premium join "Files" f
        on premium."blockchainId" = f."trackBlockchainId"
        left outer join cid_non_premium
        on f."multihash" = cid_non_premium."multihash"
        where cid_non_premium."multihash" is null`,
      {
        type: QueryTypes.SELECT
      }
    )
    const premiumCIDMap: { [key: string]: number } = {}
    result.forEach((record: { blockchainId: number; multihash: string }) => {
      premiumCIDMap[record.multihash] = record.blockchainId
    })
    return premiumCIDMap
  }

  /**
   * Logs a status message and includes current queue info
   */
  async logStatus(message: string) {
    const { waiting, active, completed, failed, delayed } =
      await this.queue.getJobCounts()
    logger.info(
      `Premium Content Queue: ${message} || active: ${active}, waiting: ${waiting}, failed ${failed}, delayed: ${delayed}, completed: ${completed} `
    )
  }

  /**
   * Starts the premium content queue
   */
  async start() {
    if (clusterUtils.isThisWorkerSpecial()) {
      try {
        // Run the job immediately
        await this.queue.add(PROCESS_NAME, {})

        // Then enqueue the job to run on a regular interval
        setInterval(async () => {
          try {
            await this.queue.add(PROCESS_NAME, {})
          } catch (e) {
            this.logStatus('Failed to enqueue!')
          }
        }, QUEUE_INTERVAL_MS)
      } catch (e) {
        this.logStatus('Startup failed!')
      }
    }
  }
}
