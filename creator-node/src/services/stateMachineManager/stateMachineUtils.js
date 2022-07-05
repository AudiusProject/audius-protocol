const { libs } = require('@audius/sdk')
const CreatorNode = libs.CreatorNode
const axios = require('axios')
const retry = require('async-retry')

const {
  MetricNames,
  MetricLabels
} = require('../../services/prometheusMonitoring/prometheus.constants')
const config = require('../../config')
const { logger } = require('../../logging')
const { generateTimestampAndSignature } = require('../../apiSigning')
const {
  BATCH_CLOCK_STATUS_REQUEST_TIMEOUT,
  CLOCK_STATUS_REQUEST_TIMEOUT_MS,
  MAX_USER_BATCH_CLOCK_FETCH_RETRIES
} = require('./stateMachineConstants')

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
 * @returns {Object} response.replicaToUserInfoMap map(replica => map(wallet => { clock, filesHash }))
 * @returns {Set} response.unhealthyPeers unhealthy peer endpoints
 */
const retrieveUserInfoFromReplicaSet = async (replicaToWalletMap) => {
  const replicaToUserInfoMap = {}
  const unhealthyPeers = new Set()

  const spID = config.get('spID')

  /** In parallel for every replica, fetch clock status for all users on that replica */
  const replicas = Object.keys(replicaToWalletMap)
  await Promise.all(
    replicas.map(async (replica) => {
      replicaToUserInfoMap[replica] = {}

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
          logger.error(
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
          replicaToUserInfoMap[replica][walletPublicKey] = {
            clock,
            filesHash
          }
        })
      }
    })
  )

  return {
    replicaToUserInfoMap,
    unhealthyPeers
  }
}

/**
 * Make request to given replica to get its clock value for given user
 * Signs request with spID to bypass rate limits
 */
const retrieveClockValueForUserFromReplica = async (replica, wallet) => {
  const spID = config.get('spID')

  const { timestamp, signature } = generateTimestampAndSignature(
    { spID },
    DELEGATE_PRIVATE_KEY
  )

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

/**
 * Returns an object that can be returned from any state machine job to record a histogram metric being observed.
 * Example: to call histogram.observe('response_time', { code: '200' }, 1000), you would call this function with:
 * makeHistogramToRecord('response_time', 1000, { code: '200' })
 * @param {string} metricName the name of the metric from prometheus.constants
 * @param {number} metricValue the value to observe
 * @param {string} [metricLabels] the optional mapping of metric label name => metric label value
 */
const makeHistogramToRecord = (metricName, metricValue, metricLabels = {}) => {
  if (!Object.values(MetricNames).includes(metricName)) {
    throw new Error(`Invalid metricName: ${metricName}`)
  }
  if (typeof metricValue !== 'number') {
    throw new Error(`Invalid non-numerical metricValue: ${metricValue}`)
  }
  const labelNames = Object.keys(MetricLabels[metricName])
  for (const [labelName, labelValue] of Object.entries(metricLabels)) {
    if (!labelNames?.includes(labelName)) {
      throw new Error(`Metric label has invliad name: ${labelName}`)
    }
    const labelValues = MetricLabels[metricName][labelName]
    if (!labelValues?.includes(labelValue)) {
      throw new Error(`Metric label has invalid value: ${labelValue}`)
    }
  }

  const metric = {
    metricName,
    metricType: 'HISTOGRAM',
    metricValue,
    metricLabels
  }
  return metric
}

module.exports = {
  retrieveClockValueForUserFromReplica,
  retrieveUserInfoFromReplicaSet,
  makeHistogramToRecord
}
