import type Logger from 'bunyan'
import type { Redis } from 'ioredis'
import type {
  RecoverOrphanedDataJobParams,
  RecoverOrphanedDataJobReturnValue
} from './types'
import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'

import axios from 'axios'
import { METRIC_NAMES } from '../../prometheusMonitoring/prometheus.constants'
import { makeGaugeSetToRecord } from '../stateMachineUtils'
import { StateMonitoringUser } from '../stateMonitoring/types'

import {
  ORPHANED_DATA_NUM_USERS_PER_QUERY,
  ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH,
  ORPHAN_DATA_DELAY_BETWEEN_BATCHES_MS
} from '../stateMachineConstants'

const { QUEUE_NAMES } = require('../stateMachineConstants')
const { getNodeUsers } = require('../stateMonitoring/stateMonitoringUtils')
const config = require('../../../config')
const redisClient: Redis = require('../../../redis')
const models = require('../../../models')
const asyncRetry = require('../../../utils/asyncRetry')
const Utils = require('../../../utils')

const WALLETS_ON_NODE_KEY = 'orphanedDataWalletsWithStateOnNode'
const WALLETS_WITH_NODE_IN_REPLICA_SET_KEY =
  'orphanedDataWalletsWithNodeInReplicaSet'
const WALLETS_ORPHANED_KEY = 'oprhanedDataWallets'

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')

/**
 * Processes a job to find users who have data on this node but who do not have this node in their replica set.
 * This means their data is "orphaned,"" so the job also issues a request to each user's primary to
 * merges their data back into the primary and then wipe it from this node.
 *
 * @param {Object} param job data
 * @param {string} param.discoveryNodeEndpoint the endpoint of a Discovery Node to query
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 */
export default async function ({
  discoveryNodeEndpoint,
  logger
}: DecoratedJobParams<RecoverOrphanedDataJobParams>): Promise<
  DecoratedJobReturnValue<RecoverOrphanedDataJobReturnValue>
> {
  const numWalletsOnNode = await _saveWalletsOnThisNodeToRedis(logger)
  const numWalletsWithNodeInReplicaSet =
    await _saveWalletsWithThisNodeInReplicaToRedis(
      discoveryNodeEndpoint,
      logger
    )
  const numWalletsWithOrphanedData = await _saveWalletsWithOrphanedDataToRedis(
    logger
  )
  const requestsIssued = await _batchIssueReqsToRecoverOrphanedData(
    numWalletsWithOrphanedData,
    discoveryNodeEndpoint,
    logger
  )

  return {
    numWalletsOnNode,
    numWalletsWithNodeInReplicaSet,
    numWalletsWithOrphanedData,
    jobsToEnqueue: {
      // Enqueue another job to search for any new data that gets orphaned after this job finishes
      [QUEUE_NAMES.RECOVER_ORPHANED_DATA]: [
        {
          discoveryNodeEndpoint
        }
      ]
    },
    metricsToRecord: [
      makeGaugeSetToRecord(
        METRIC_NAMES.RECOVER_ORPHANED_DATA_WALLET_COUNTS_GAUGE,
        numWalletsWithOrphanedData
      ),
      makeGaugeSetToRecord(
        METRIC_NAMES.RECOVER_ORPHANED_DATA_SYNC_COUNTS_GAUGE,
        requestsIssued
      )
    ]
  }
}

/**
 * Queries this node's db to find all users who have data on it and adds them to a redis set.
 */
const _saveWalletsOnThisNodeToRedis = async (logger: Logger) => {
  await redisClient.del(WALLETS_ON_NODE_KEY)

  type WalletSqlRow = {
    walletPublicKey: string
    cnodeUserUUID: string
  }
  let walletSqlRows: WalletSqlRow[] = []

  // Make paginated SQL queries to find all wallets with data on this node.
  // Table is indexed on column `cnodeUserUUID`
  const numCNodeUsers = await models.CNodeUser.count()
  let prevCnodeUserUUID = '00000000-0000-0000-0000-000000000000'
  for (let i = 0; i < numCNodeUsers; i += ORPHANED_DATA_NUM_USERS_PER_QUERY) {
    walletSqlRows = await models.CNodeUser.findAll({
      attributes: ['walletPublicKey', 'cnodeUserUUID'],
      order: [['cnodeUserUUID', 'ASC']],
      where: {
        cnodeUserUUID: {
          [models.Sequelize.Op.gte]: prevCnodeUserUUID
        }
      },
      limit: ORPHANED_DATA_NUM_USERS_PER_QUERY
    })

    if (walletSqlRows?.length) {
      // Save the wallets to a redis set
      const walletsOnThisNodeArr: string[] = []
      walletSqlRows.forEach((row) =>
        walletsOnThisNodeArr.push(row.walletPublicKey)
      )
      await redisClient.sadd(WALLETS_ON_NODE_KEY, walletsOnThisNodeArr)

      // Move pagination cursor to the end
      prevCnodeUserUUID = walletSqlRows[walletSqlRows.length - 1].cnodeUserUUID
    }
  }

  const numWalletsOnNode = await redisClient.scard(WALLETS_ON_NODE_KEY)
  logger.info(
    `Orphaned data recovery found ${numWalletsOnNode} wallets with data on this node`
  )
  return numWalletsOnNode
}

/**
 * Queries the given discovery node to find all users who have this content node as their primary or secondary.
 * Adds them to a redis set.
 */
const _saveWalletsWithThisNodeInReplicaToRedis = async (
  discoveryNodeEndpoint: string,
  logger: Logger
) => {
  await redisClient.del(WALLETS_WITH_NODE_IN_REPLICA_SET_KEY)

  // Make paginated Discovery queries to find all wallets with this current node in their replica set (primary or secondary)
  let prevUserId = 0
  let batchOfUsers: StateMonitoringUser[] = []
  do {
    try {
      batchOfUsers = await getNodeUsers(
        discoveryNodeEndpoint,
        thisContentNodeEndpoint,
        prevUserId,
        ORPHANED_DATA_NUM_USERS_PER_QUERY
      )

      if (batchOfUsers?.length) {
        // Save the wallets to a redis set
        const walletsWithNodeInReplicaSetArr: string[] = []
        batchOfUsers.forEach((user) =>
          walletsWithNodeInReplicaSetArr.push(user.wallet)
        )
        await redisClient.sadd(
          WALLETS_WITH_NODE_IN_REPLICA_SET_KEY,
          walletsWithNodeInReplicaSetArr
        )

        // Move pagination cursor to the end of the batch
        prevUserId = batchOfUsers[batchOfUsers.length - 1].user_id
      } else {
        prevUserId = 0
      }
    } catch (e: any) {
      logger.error(
        `Error fetching batch of users from ${discoveryNodeEndpoint}: ${e.message}`
      )
      // `batchOfUsers?.length` will be 0, which will cause us to break out of this loop and not fetch all users.
      // This will cause extra users to be marked as orphaned, which is okay because orphaned data
      // recovery will short circuit later to avoid wiping state on any node in the user's replica set.
    }
  } while (
    batchOfUsers?.length === ORPHANED_DATA_NUM_USERS_PER_QUERY &&
    prevUserId !== 0
  )

  const numWalletsWithNodeInReplicaSet = await redisClient.scard(
    WALLETS_WITH_NODE_IN_REPLICA_SET_KEY
  )
  logger.info(
    `Orphaned data recovery found ${numWalletsWithNodeInReplicaSet} wallets with this node in their replica set`
  )
  return numWalletsWithNodeInReplicaSet
}

/**
 * Finds wallets that are orphaned and adds them to a redis set.
 * (Set of orphaned wallets) = (set of wallets on this node) - (set of wallets with this node in their replica set)
 * @returns number of wallets that have data orphaned on this node
 */
const _saveWalletsWithOrphanedDataToRedis = async (logger: Logger) => {
  const numWalletsOrphaned: number = await redisClient.sdiffstore(
    WALLETS_ORPHANED_KEY,
    WALLETS_ON_NODE_KEY,
    WALLETS_WITH_NODE_IN_REPLICA_SET_KEY
  )
  logger.info(
    `Orphaned data recovery found ${numWalletsOrphaned} wallets with data orphaned on this node`
  )
  return numWalletsOrphaned
}

/**
 * Pops from redis set in batches and issues requests to move data that's orphaned on this node back to each user's primary.
 * Each request will sync from this node to a primary and then "force wipe" this node:
 *  1. Merge orphaned data from this node into the user's primary.
 *  2. Wipe the user's data from this node.
 *  3. *DON'T* resync from the primary to this node -- this is what non-modified forceResync would do -- and instead set forceWipe=true.
 * @param {number} numWalletsWithOrphanedData number of users to issue requests to recover orphaned data for
 * @param {string} discoveryNodeEndpoint the endpoint of a discovery node to make queries to
 * @param {Logger} logger logger
 * @return {number} number of requests successfully issued
 */
const _batchIssueReqsToRecoverOrphanedData = async (
  numWalletsWithOrphanedData: number,
  discoveryNodeEndpoint: string,
  logger: Logger
): Promise<number> => {
  let requestsIssued = 0
  for (
    let i = 0;
    i < numWalletsWithOrphanedData;
    i += ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH
  ) {
    const walletsWithOrphanedData = await redisClient.spop(
      WALLETS_ORPHANED_KEY,
      ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH
    )
    if (!walletsWithOrphanedData?.length) return requestsIssued

    for (const wallet of walletsWithOrphanedData) {
      const primaryEndpoint = await _getPrimaryForWallet(
        wallet,
        discoveryNodeEndpoint,
        logger
      )
      if (!primaryEndpoint) continue

      try {
        await axios({
          baseURL: primaryEndpoint,
          url: '/merge_primary_and_secondary',
          method: 'post',
          params: {
            wallet,
            endpoint: thisContentNodeEndpoint,
            forceWipe: true
          }
        })
        requestsIssued++
      } catch (e: any) {
        logger.error(
          `Error issuing request to recover orphaned data: ${e.message}`
        )
      }
    }

    logger.info(
      `Orphaned data recovery issued /merge_primary_and_secondary requests for ${i}/${numWalletsWithOrphanedData} wallets`
    )
    // Delay processing the next batch to avoid spamming requests
    await Utils.timeout(ORPHAN_DATA_DELAY_BETWEEN_BATCHES_MS, false)
  }
  return requestsIssued
}

const _getPrimaryForWallet = async (
  wallet: string,
  discoveryNodeEndpoint: string,
  logger: Logger
): Promise<string> => {
  let user
  try {
    const resp = await asyncRetry({
      logLabel: "fetch user's primary endpoint",
      options: { retries: 3 },
      asyncFn: async () => {
        return axios({
          method: 'get',
          baseURL: discoveryNodeEndpoint,
          url: 'users',
          params: {
            wallet
          },
          timeout: 2000
        })
      },
      logger
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
