const { Queue, Worker } = require('bullmq')

const config = require('../../config')
const { createChildLogger } = require('../../logging')
const { generateTimestampAndSignature } = require('../../apiSigning')
const { CLOCK_STATUS_REQUEST_TIMEOUT_MS } = require('./stateMachineConstants')
const { instrumentTracing, tracing } = require('../../tracer')
const { clearActiveJobs } = require('../../utils')

const DELEGATE_PRIVATE_KEY = config.get('delegatePrivateKey')

/**
 * Make request to given replica to get its clock value for given user
 * Signs request with spID to bypass rate limits
 */
const _retrieveClockValueForUserFromReplica = async (replica, wallet) => {
  const spID = config.get('spID')

  const { timestamp, signature } = generateTimestampAndSignature(
    { spID },
    DELEGATE_PRIVATE_KEY
  )

  const { libs } = require('@audius/sdk')
  const CreatorNode = libs.CreatorNode
  const clockValue = await CreatorNode.getClockValue(
    replica,
    wallet,
    CLOCK_STATUS_REQUEST_TIMEOUT_MS,
    {
      spID,
      timestamp,
      signature
    }
  )

  return clockValue
}

const retrieveClockValueForUserFromReplica = instrumentTracing({
  fn: _retrieveClockValueForUserFromReplica,
  options: {
    attributes: {
      [tracing.CODE_FILEPATH]: __filename
    }
  }
})

const makeQueue = async ({
  name,
  processor,
  logger,
  removeOnComplete,
  removeOnFail,
  prometheusRegistry,
  concurrency = 1,
  limiter = null
}) => {
  const connection = {
    host: config.get('redisHost'),
    port: config.get('redisPort')
  }
  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      removeOnComplete,
      removeOnFail
    }
  })

  // Clear any old state if redis was running but the rest of the server restarted
  await queue.obliterate({ force: true })
  await clearActiveJobs(queue, logger)

  const worker = new Worker(name, processor, {
    connection,
    concurrency,
    limiter
  })

  _registerQueueEvents(worker, logger)

  if (prometheusRegistry !== null && prometheusRegistry !== undefined) {
    prometheusRegistry.startQueueMetrics(queue, worker)
  }

  return { queue, worker, logger }
}

const _registerQueueEvents = (worker, queueLogger) => {
  worker.on('active', (job, _prev) => {
    const logger = createChildLogger(queueLogger, { jobId: job.id })
    logger.debug('Job active')
  })
  worker.on('failed', (job, error, _prev) => {
    const loggerWithId = createChildLogger(queueLogger, {
      jobId: job?.id || 'unknown'
    })
    loggerWithId.error(`Job failed to complete. ID=${job?.id}. Error=${error}`)
  })
  worker.on('error', (failedReason) => {
    queueLogger.error(`Job error - ${failedReason}`)
  })
  worker.on('stalled', (jobId, _prev) => {
    const logger = createChildLogger(queueLogger, { jobId })
    logger.debug('Job stalled')
  })
}

module.exports = {
  retrieveClockValueForUserFromReplica,
  makeQueue
}
