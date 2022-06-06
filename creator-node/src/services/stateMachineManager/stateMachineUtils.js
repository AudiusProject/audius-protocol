const { libs } = require('@audius/sdk')
const CreatorNode = libs.CreatorNode
const axios = require('axios')
const retry = require('async-retry')

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
const SP_ID = config.get('spID')
const DELEGATE_PRIVATE_KEY = config.get('delegatePrivateKey')

/**
 * Given map(replica node => userWallets[]), retrieves clock values for every (node, userWallet) pair.
 * Also returns a set of any nodes that were unhealthy when queried for clock values.
 * @param {Object} replicaSetNodesToUserWalletsMap map of <replica set node : wallets>
 *
 * @returns {Object} { replicasToUserClockStatusMap: map(replica node => map(wallet => clockValue)), unhealthyPeers: Set<string> }
 */
const retrieveClockStatusesForUsersAcrossReplicaSet = async (
  replicasToWalletsMap
) => {
  const replicasToUserClockStatusMap = {}
  const unhealthyPeers = new Set()

  /** In parallel for every replica, fetch clock status for all users on that replica */
  const replicas = Object.keys(replicasToWalletsMap)
  await Promise.all(
    replicas.map(async (replica) => {
      replicasToUserClockStatusMap[replica] = {}

      const walletsOnReplica = replicasToWalletsMap[replica]

      // Make requests in batches, sequentially, to ensure POST request body does not exceed max size
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
          url: '/users/batch_clock_status',
          method: 'post',
          data: { walletPublicKeys: walletsOnReplicaSlice },
          timeout: BATCH_CLOCK_STATUS_REQUEST_TIMEOUT
        }

        // Sign request to other CN to bypass rate limiting
        const { timestamp, signature } = generateTimestampAndSignature(
          { spID: SP_ID },
          DELEGATE_PRIVATE_KEY
        )
        axiosReqParams.params = { spID: SP_ID, timestamp, signature }

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

        // If failed to get response after all attempts, add replica to `unhealthyPeers` set for reconfig
        if (errorMsg) {
          logger.error(
            `retrieveClockStatusesForUsersAcrossReplicaSet() Could not fetch clock values for wallets=${walletsOnReplica} on replica=${replica} ${errorMsg.toString()}`
          )
          unhealthyPeers.add(replica)
        }

        // Add batch response data to aggregate output map
        batchClockStatusResp.forEach((userClockValueResp) => {
          const { walletPublicKey, clock } = userClockValueResp
          replicasToUserClockStatusMap[replica][walletPublicKey] = clock
        })
      }
    })
  )

  return {
    replicasToUserClockStatusMap,
    unhealthyPeers
  }
}

/**
 * Make request to given replica to get its clock value for given user
 * Signs request with spID to bypass rate limits
 */
const retrieveClockValueForUserFromReplica = async (replica, wallet) => {
  const spID = SP_ID

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

module.exports = {
  retrieveClockStatusesForUsersAcrossReplicaSet,
  retrieveClockValueForUserFromReplica
}
