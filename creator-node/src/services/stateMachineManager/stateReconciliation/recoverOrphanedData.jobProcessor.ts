import axios from 'axios'
import type Logger from 'bunyan'
import { SyncType, SYNC_MODES } from '../stateMachineConstants'
import { StateMonitoringUser } from '../stateMonitoring/types'
import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import { getNewOrExistingSyncReq } from './stateReconciliationUtils'
import type {
  IssueSyncRequestJobParams,
  RecoverOrphanedDataJobParams,
  RecoverOrphanedDataJobReturnValue
} from './types'

const _ = require('lodash')
const { QUEUE_NAMES } = require('../stateMachineConstants')
const { getNodeUsers } = require('../stateMonitoring/stateMonitoringUtils')
const config = require('../../../config')
const redisClient = require('../../../redis')
const models = require('../../../models')

const WALLETS_ON_NODE_KEY = 'orphanedDataWalletsWithStateOnNode'
const WALLETS_WITH_NODE_IN_REPLICA_SET_KEY =
  'orphanedDataWalletsWithNodeInReplicaSet'
const WALLETS_ORPHANED_OR_UNSYNCED_KEY = 'oprhanedDataWalletsOrphanedOrUnsynced'
const NUM_USERS_PER_QUERY = 10_000

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')

/**
 * Processes a job to find users who have data on this node but who do not have this node in their replica set.
 * This means their data is "orphaned,"" so the job also merges this data back into the primary of the user's replica set and then wipes it from this node.
 *
 * @param {Object} param job data
 * @param {string} param.discoveryNodeEndpoint the endpoint of a Discovery Node to query
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 */
module.exports = async function ({
  discoveryNodeEndpoint,
  logger
}: DecoratedJobParams<RecoverOrphanedDataJobParams>): Promise<
  DecoratedJobReturnValue<RecoverOrphanedDataJobReturnValue>
> {
  const numWalletsOnNode = await _storeWalletsOnThisNode()
  const numWalletsWithNodeInReplicaSet =
    await _storeWalletsWithThisNodeInReplica(discoveryNodeEndpoint)
  const numWalletsOrphanedOrUnsynced = await _storeWalletsOrphanedOrUnsynced()
  const walletsWithOrphanedData = await _getWalletsWithOrphanedData()

  // Get sync requests that will be issued to sync orphaned data from this node back to each user's primary
  const syncReqsToEnqueue: IssueSyncRequestJobParams[] = []
  for (const wallet of walletsWithOrphanedData) {
    const syncReqToEnqueue = await _getSyncReqToRecoverOrphanedData(
      wallet,
      discoveryNodeEndpoint,
      logger
    )
    if (!_.isEmpty(syncReqToEnqueue)) {
      syncReqsToEnqueue.push(syncReqToEnqueue as IssueSyncRequestJobParams)
    }
  }

  return {
    numWalletsOnNode,
    numWalletsWithNodeInReplicaSet,
    numWalletsOrphanedOrUnsynced,
    walletsWithOrphanedData,
    jobsToEnqueue: {
      // Enqueue jobs to recover orphaned data by syncing primary from this node and then wiping this node's data for the user
      [QUEUE_NAMES.RECURRING_SYNC]: syncReqsToEnqueue,

      // Enqueue another job to search for any new data that gets orphaned after this job finishes
      [QUEUE_NAMES.RECOVER_ORPHANED_DATA]: [
        {
          discoveryNodeEndpoint
        }
      ]
    },
    metricsToRecord: [] // TODO
  }
}

/**
 * Queries this node's db to find all users who have data on it and adds them to a redis set.
 */
const _storeWalletsOnThisNode = async () => {
  await redisClient.del(WALLETS_ON_NODE_KEY)

  // Make paginated SQL queries to find all wallets with data on this node
  type WalletSqlRow = { walletPublicKey: string }
  let prevWalletPublicKey = '0x'
  const walletsOnThisNodeArr: string[] = []
  let walletSqlRows: WalletSqlRow[] = []
  do {
    walletSqlRows = await models.CNodeUser.findAll({
      attributes: ['walletPublicKey'],
      order: [['walletPublicKey', 'ASC']],
      where: {
        walletPublicKey: {
          [models.Sequelize.Op.gte]: prevWalletPublicKey
        }
      },
      limit: NUM_USERS_PER_QUERY
    })
    walletSqlRows?.forEach((row) =>
      walletsOnThisNodeArr.push(row.walletPublicKey)
    )

    // Move pagination cursor to the end
    prevWalletPublicKey = walletsOnThisNodeArr.length
      ? walletsOnThisNodeArr[walletsOnThisNodeArr.length - 1]
      : '0x'
  } while (
    walletSqlRows?.length === NUM_USERS_PER_QUERY &&
    prevWalletPublicKey !== '0x'
  )

  // Save the wallets as a redis set and return the set cardinality
  const numWalletsOnNode = walletsOnThisNodeArr.length
    ? await redisClient.sadd(WALLETS_ON_NODE_KEY, walletsOnThisNodeArr)
    : 0
  return numWalletsOnNode
}

/**
 * Queries the given discovery node to find all users who have this content node as their primary or secondary.
 * Adds them to a redis set.
 */
const _storeWalletsWithThisNodeInReplica = async (
  discoveryNodeEndpoint: string
) => {
  await redisClient.del(WALLETS_WITH_NODE_IN_REPLICA_SET_KEY)

  // Make paginated Discovery queries to find all wallets with this current node in their replica set (primary or secondary)
  let prevUserId = 0
  let batchOfUsers: StateMonitoringUser[] = []
  const walletsWithNodeInReplicaSetArr: string[] = []
  do {
    // Get batch of users and all it to the array of all wallets
    batchOfUsers = await getNodeUsers(
      discoveryNodeEndpoint,
      thisContentNodeEndpoint,
      prevUserId,
      NUM_USERS_PER_QUERY
    )
    batchOfUsers?.forEach((user) =>
      walletsWithNodeInReplicaSetArr.push(user.wallet)
    )

    // Move pagination cursor to the end of the batch
    prevUserId = batchOfUsers?.length
      ? batchOfUsers[batchOfUsers.length - 1].user_id
      : 0
  } while (batchOfUsers?.length === NUM_USERS_PER_QUERY && prevUserId !== 0)

  // Save the wallets as a redis set and return the set cardinality
  const numWalletsWithNodeInReplicaSet = walletsWithNodeInReplicaSetArr.length
    ? await redisClient.sadd(
        WALLETS_WITH_NODE_IN_REPLICA_SET_KEY,
        walletsWithNodeInReplicaSetArr
      )
    : 0
  return numWalletsWithNodeInReplicaSet
}

/**
 * Gets a sync request that can be issued to "force wipe" (modified forceResync=true flag):
 *  1. Merges orphaned data from this node into the user's primary.
 *  2. Wipes the user's data from this node.
 *  3. *DON'T* resync from the primary to this node -- this is what non-modified forceResync would do -- and instead set forceWipe=true.
 * @param wallet the wallet of the user with data orphaned on this node
 */
const _getSyncReqToRecoverOrphanedData = async (
  wallet: string,
  discoveryNodeEndpoint: string,
  logger: Logger
): Promise<IssueSyncRequestJobParams | undefined> => {
  const primaryEndpoint = await _getPrimaryForWallet(
    wallet,
    discoveryNodeEndpoint,
    logger
  )
  if (!primaryEndpoint) return undefined

  try {
    const { syncReqToEnqueue } = getNewOrExistingSyncReq({
      userWallet: wallet,
      primaryEndpoint,
      secondaryEndpoint: thisContentNodeEndpoint,
      syncType: SyncType.Recurring,
      syncMode: SYNC_MODES.MergePrimaryThenWipeSecondary
    })

    return syncReqToEnqueue
  } catch (e: any) {
    logger.error(
      `Error getting sync request to recover orphaned data for user ${wallet} with primary ${primaryEndpoint} - ${e.message}`
    )
    return undefined
  }
}

/**
 * Adds wallets that are orphaned or unsynced to a redis set.
 * This is the same as the set difference between walletsOnThisNode and walletsWithThisNodeInReplicaSet.
 * @returns number of wallets that either:
 *          * have data on this node but don't have this node in their replica set (they're orphaned)
 *          * have this node in their Replica Set but don't have data on this node (they're unsynced)
 */
const _storeWalletsOrphanedOrUnsynced = async () => {
  await redisClient.del(WALLETS_ORPHANED_OR_UNSYNCED_KEY)
  const numWalletsOrphanedOrUnsynced = await redisClient.sdiffstore(
    WALLETS_ORPHANED_OR_UNSYNCED_KEY,
    WALLETS_ON_NODE_KEY,
    WALLETS_WITH_NODE_IN_REPLICA_SET_KEY
  )
  return numWalletsOrphanedOrUnsynced
}

/**
 * @returns string[] of wallets with data orphaned on this node by taking the set intersection of
 *          wallets with data on this node and wallets with orphaned data or unsynced data (this filters
 *          out wallets that only have this node in their ReplicaSet but no data on this node)
 */
const _getWalletsWithOrphanedData = async () => {
  const walletsWithOrphanedData: string[] = await redisClient.sinter(
    WALLETS_ON_NODE_KEY,
    WALLETS_ORPHANED_OR_UNSYNCED_KEY
  )
  return walletsWithOrphanedData
}

const _getPrimaryForWallet = async (
  wallet: string,
  discoveryNodeEndpoint: string,
  logger: Logger
): Promise<string> => {
  let user
  try {
    const resp = await axios({
      method: 'get',
      baseURL: discoveryNodeEndpoint,
      url: 'users',
      params: {
        wallet
      },
      timeout: 2000
    })
    user = resp?.data?.data?.[0]
  } catch (e: any) {
    logger.error(
      `Error fetching user data for orphaned wallet ${wallet}: ${e.message}`
    )
  }
  const replicaSet = user?.creator_node_endpoint?.split(',')
  if (!replicaSet) {
    logger.error(
      `Couldn't find primary endpoint for wallet ${wallet}. User: ${JSON.stringify(
        user || {}
      )}`
    )
    return ''
  }
  return replicaSet[0]
}
