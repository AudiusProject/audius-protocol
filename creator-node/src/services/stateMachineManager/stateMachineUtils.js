const { Queue, Worker } = require('bullmq')

const axios = require('axios')
const retry = require('async-retry')

const config = require('../../config')
const { logger: baseLogger, createChildLogger } = require('../../logging')
const { generateTimestampAndSignature } = require('../../apiSigning')
const {
  BATCH_CLOCK_STATUS_REQUEST_TIMEOUT,
  CLOCK_STATUS_REQUEST_TIMEOUT_MS,
  MAX_USER_BATCH_CLOCK_FETCH_RETRIES
} = require('./stateMachineConstants')
const { instrumentTracing, tracing } = require('../../tracer')
const { clearActiveJobs } = require('../../utils')

const MAX_BATCH_CLOCK_STATUS_BATCH_SIZE = config.get(
  'maxBatchClockStatusBatchSize'
)
const DELEGATE_PRIVATE_KEY = config.get('delegatePrivateKey')

/**
 * Given map(replica set node => userWallets[]), retrieves user info for every (node, userWallet) pair
 * Also updates unhealthyPeers param with nodes that were unhealthy when queried
 *
 * @param {Object} replicaSetNodesToUserWalletsMap map of <replica set node : wallets>
 *
 * @returns {Object} response
 * @returns {Object} response.replicaToAllUserInfoMaps map(replica => map(wallet => { clock, filesHash }))
 * @returns {Set} response.unhealthyPeers unhealthy peer endpoints
 */
const retrieveUserInfoFromReplicaSet = async (replicaToWalletMap) => {
  const replicaToAllUserInfoMaps = {}
  const unhealthyPeers = new Set()

  const spID = config.get('spID')

  /** In parallel for every replica, fetch clock status for all users on that replica */
  const replicas = Object.keys(replicaToWalletMap)
  await Promise.all(
    replicas.map(async (replica) => {
      replicaToAllUserInfoMaps[replica] = {}

      const walletsOnReplica = replicaToWalletMap[replica]

      // Make requests in batches, sequentially, since this is an expensive query
      for (
        let i = 0;
        i < walletsOnReplica.length;
        i += MAX_BATCH_CLOCK_STATUS_BATCH_SIZE
      ) {
        const walletsOnReplicaSlice = walletsOnReplica.slice(
          i,
          i + MAX_BATCH_CLOCK_STATUS_BATCH_SIZE
        )

        const axiosReqParams = {
          baseURL: replica,
          url: '/users/batch_clock_status?returnFilesHash=true',
          method: 'post',
          data: { walletPublicKeys: walletsOnReplicaSlice },
          timeout: BATCH_CLOCK_STATUS_REQUEST_TIMEOUT
        }

        // Generate and attach SP signature to bypass route rate limits
        const { timestamp, signature } = generateTimestampAndSignature(
          { spID: spID },
          DELEGATE_PRIVATE_KEY
        )
        axiosReqParams.params = { spID: spID, timestamp, signature }

        let batchClockStatusResp = []
        let errorMsg
        try {
          batchClockStatusResp = (
            await retry(async () => axios(axiosReqParams), {
              retries: MAX_USER_BATCH_CLOCK_FETCH_RETRIES
            })
          ).data.data.users
        } catch (e) {
          errorMsg = e
        }

        // If failed to get response after all attempts, add replica to `unhealthyPeers` list for reconfig
        if (errorMsg) {
          baseLogger.error(
            `[retrieveUserInfoFromReplicaSet] Could not fetch clock values from replica ${replica}: ${errorMsg.toString()}`
          )
          unhealthyPeers.add(replica)
        }

        // Add response data to output aggregate map
        batchClockStatusResp.forEach((clockStatusResp) => {
          /**
           * @notice `filesHash` will be null if node has no files for user. This can happen even if clock > 0 if user has AudiusUser or Track table records without any File table records
           */
          const { walletPublicKey, clock, filesHash } = clockStatusResp
          replicaToAllUserInfoMaps[replica][walletPublicKey] = {
            clock,
            filesHash
          }
        })
      }
    })
  )

  return {
    replicaToAllUserInfoMaps,
    unhealthyPeers
  }
}

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
  retrieveUserInfoFromReplicaSet,
  makeQueue
}
