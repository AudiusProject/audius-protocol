/**
 * Util functions for fetching+updating the redis cache of info about content nodes.
 * Maintains a bidirectional mappings of SP ID <--> chain info (endpoint and delegateOwnerWallet).
 * TODO: Rename this to SpInfoManager and cache Discovery Nodes
 */

import type Logger from 'bunyan'

import _ from 'lodash'

import initAudiusLibs from './initAudiusLibs'
import { createChildLogger } from '../logging'
import defaultRedisClient from '../redis'

const SP_ID_TO_CHAIN_INFO_MAP_KEY = 'contentNodeInfoManagerSpIdMap'

async function updateContentNodeChainInfo(
  logger: Logger,
  redisClient = defaultRedisClient,
  ethContracts?: EthContracts
) {
  try {
    if (!ethContracts) ethContracts = await _initLibsAndGetEthContracts(logger)
    const contentNodesFromLibs =
      (await ethContracts.getServiceProviderList('content-node')) || []
    const spIdToChainInfoFromChain = new Map(
      contentNodesFromLibs.map((cn) => [
        cn.spID,
        _.pick(cn, ['endpoint', 'delegateOwnerWallet'])
      ])
    )
    if (spIdToChainInfoFromChain.size > 0) {
      redisClient.set(
        SP_ID_TO_CHAIN_INFO_MAP_KEY,
        JSON.stringify(Array.from(spIdToChainInfoFromChain.entries()))
      )
    }
  } catch (e: any) {
    logger.error(
      `Failed to fetch content nodes from chain and update mapping: ${e.message}`
    )
  }
}

async function getMapOfSpIdToChainInfo(
  logger: Logger,
  redisClient = defaultRedisClient
): Promise<Map<number, ContentNodeFromChain>> {
  try {
    const serializedMapFromRedis = await redisClient.get(
      SP_ID_TO_CHAIN_INFO_MAP_KEY
    )
    if (_.isEmpty(serializedMapFromRedis)) return new Map()
    return new Map<number, ContentNodeFromChain>(
      JSON.parse(serializedMapFromRedis as string)
    )
  } catch (e: any) {
    logger.error(
      `ContentNodeInfoManager error: Failed to fetch and parse serialized mapping: ${e.message}: ${e.stack}`
    )
    return new Map()
  }
}

async function getMapOfCNodeEndpointToSpId(
  logger: Logger,
  redisClient = defaultRedisClient
) {
  const spIdToChainInfo: Map<number, ContentNodeFromChain> =
    await getMapOfSpIdToChainInfo(logger, redisClient)
  const cNodeEndpointToSpIdMap = new Map<string, number>()
  spIdToChainInfo.forEach((chainInfo, spId) => {
    cNodeEndpointToSpIdMap.set(chainInfo.endpoint, spId)
  })
  return cNodeEndpointToSpIdMap
}

async function getSpIdFromEndpoint(
  endpoint: string,
  logger: Logger,
  redisClient = defaultRedisClient
): Promise<number | undefined> {
  const cNodeEndpointToSpIdMap: Map<string, number> =
    await getMapOfCNodeEndpointToSpId(logger, redisClient)
  return cNodeEndpointToSpIdMap.get(endpoint)
}

async function getContentNodeInfoFromSpId(
  spId: number,
  logger: Logger,
  redisClient = defaultRedisClient
): Promise<ContentNodeFromChain | undefined> {
  const map = await getMapOfSpIdToChainInfo(logger, redisClient)
  return map.get(spId)
}

export type ReplicaSetSpIds = {
  primaryId: number | undefined
  secondaryIds: number[]
}
export type UserReplicaSetManagerClient = {
  getUserReplicaSetAtBlockNumber: (
    userId: number,
    blockNumber: number
  ) => Promise<ReplicaSetSpIds>
  getUserReplicaSet: (userId: number) => Promise<ReplicaSetSpIds>
}
export type GetReplicaSetSpIdsByUserIdParams = {
  userReplicaSetManagerClient: UserReplicaSetManagerClient
  userId: number
  blockNumber?: number
  ensurePrimary?: boolean
  selfSpId?: number
  parentLogger: Logger
}
/**
 * Retrieves user replica set spIDs from chain (POA.UserReplicaSetManager)
 *
 * Polls contract (via web3 provider) conditionally as follows:
 *    - If `blockNumber` provided, polls contract until it has indexed that blockNumber (for up to 200 seconds)
 *    - Else if `ensurePrimary` required, polls contract until it has indexed selfSpID as primary (for up to 60 seconds)
 *      - Errors if retrieved primary spID does not match selfSpID
 *    - If neither of above conditions are met, falls back to single contract query without polling
 *
 * @param {GetReplicaSetSpIdsByUserIdParams} params
 * @param {UserReplicaSetManagerClient} params.userReplicaSetManagerClient URSM interface from libs
 * @param {number} params.userId userId used to query chain contract
 * @param {number} params.blockNumber blocknumber of eth TX preceding CN call
 * @param {boolean} params.ensurePrimary determines if function should error if this CN is not primary
 * @param {number} params.selfSpId SP ID of this Content Node
 * @param {bunyan.Logger} params.parentLogger logger to add properties to for this function call
 *
 * @returns {ReplicaSet} object with user's primary and secondary SP IDs
 */
async function getReplicaSetSpIdsByUserId({
  userReplicaSetManagerClient,
  userId,
  blockNumber,
  ensurePrimary,
  selfSpId,
  parentLogger
}: GetReplicaSetSpIdsByUserIdParams): Promise<ReplicaSetSpIds> {
  const start = Date.now()
  const logger = createChildLogger(parentLogger, {
    function: 'getReplicaSetSpIds',
    userId,
    selfSpId,
    blockNumber,
    ensurePrimary
  }) as Logger

  let replicaSet: ReplicaSetSpIds = {
    primaryId: undefined,
    secondaryIds: []
  }

  /**
   * If `blockNumber` provided, poll contract until it has indexed that blocknumber (for up to 200 seconds)
   */
  if (blockNumber) {
    // In total, will try for 200 seconds.
    const MAX_RETRIES = 201
    const RETRY_TIMEOUT_MS = 1000 // 1 seconds

    let errorMsg = null
    let blockNumberIndexed = false
    for (let retry = 1; retry <= MAX_RETRIES; retry++) {
      logger.info(
        `retry #${retry}/${MAX_RETRIES} || time from start: ${
          Date.now() - start
        }. Polling until blockNumber ${blockNumber}.`
      )

      try {
        // will throw error if blocknumber not found
        replicaSet =
          await userReplicaSetManagerClient.getUserReplicaSetAtBlockNumber(
            userId,
            blockNumber
          )
        errorMsg = null
        blockNumberIndexed = true
        break
      } catch (e: any) {
        errorMsg = e.message
      } // Ignore all errors until MAX_RETRIES exceeded

      await timeout(RETRY_TIMEOUT_MS)
    }

    // Error if indexed blockNumber but didn't find any replicaSet for user
    if (blockNumberIndexed && !replicaSet.primaryId) {
      throw new Error(
        `ERROR || Failed to retrieve user from UserReplicaSetManager after ${MAX_RETRIES} retries. Aborting.`
      )
    }

    // Error if failed to index target blockNumber
    if (!blockNumberIndexed) {
      throw new Error(
        `ERROR || Web3 provider failed to index target blockNumber ${blockNumber} after ${MAX_RETRIES} retries. Aborting. Error ${errorMsg}`
      )
    }
  } else if (ensurePrimary && selfSpId) {
    /**
     * If ensurePrimary required but no blockNumber provided, poll URSM until returned primary = selfSpID
     * Error if still mismatched after specified timeout
     */

    // Will poll every second for 60 sec
    const MAX_RETRIES = 61
    const RETRY_TIMEOUT_MS = 1000 // 1 sec

    let errorMsg = null
    for (let retry = 1; retry <= MAX_RETRIES; retry++) {
      logger.info(
        `retry #${retry}/${MAX_RETRIES} || time from start: ${
          Date.now() - start
        }. Polling until primaryEnsured.`
      )

      try {
        replicaSet = await userReplicaSetManagerClient.getUserReplicaSet(userId)

        errorMsg = null

        if (replicaSet.primaryId === selfSpId) break
      } catch (e: any) {
        errorMsg = e.message
      } // Ignore all errors until MAX_RETRIES exceeded

      await timeout(RETRY_TIMEOUT_MS)
    }

    // Error if failed to retrieve replicaSet
    if (!replicaSet.primaryId) {
      throw new Error(
        `ERROR || Failed to retrieve user from UserReplicaSetManager after ${MAX_RETRIES} retries. Aborting. Error ${errorMsg}`
      )
    }

    // Error if returned primary spID does not match self spID
    if (replicaSet.primaryId !== selfSpId) {
      throw new Error(
        `ERROR || After ${MAX_RETRIES} retries, found different primary (${replicaSet.primaryId}) for user. Aborting.`
      )
    }
  } else {
    /**
     * If neither of above conditions are met, falls back to single chain call without polling
     */

    logger.info(
      `ensurePrimary = false, fetching user replicaSet without retries`
    )

    let errorMsg = null
    try {
      replicaSet = await userReplicaSetManagerClient.getUserReplicaSet(userId)
    } catch (e: any) {
      errorMsg = e.message
    }

    if (!replicaSet.primaryId) {
      throw new Error(
        `ERROR || Failed to retrieve user from UserReplicaSetManager. Aborting. Error ${errorMsg}`
      )
    }
  }

  logger.info(
    `completed in ${Date.now() - start}. replicaSet = [${JSON.stringify(
      replicaSet
    )}]`
  )
  return replicaSet
}

export type ReplicaSetEndpoints = {
  primary?: string
  secondary1?: string
  secondary2?: string
}
export type GetReplicaSetEndpointsParams = {
  userReplicaSetManagerClient: UserReplicaSetManagerClient
  wallet: string
  parentLogger: Logger
  getUsers: (
    limit: number,
    offset: number,
    idsArray: null,
    wallet: string
  ) => Promise<{ user_id: number }>
  getMapOfSpIdToChainInfo?: () => Promise<Map<number, ContentNodeFromChain>>
}
async function getReplicaSetEndpointsByWallet({
  userReplicaSetManagerClient,
  wallet,
  parentLogger,
  getUsers,
  getMapOfSpIdToChainInfo = ContentNodeInfoManager().getMapOfSpIdToChainInfo
}: GetReplicaSetEndpointsParams): Promise<ReplicaSetEndpoints> {
  const user: { user_id: number } = await getUsers(1, 0, null, wallet)
  const replicaSetSpIds = await getReplicaSetSpIdsByUserId({
    userReplicaSetManagerClient,
    userId: user.user_id,
    parentLogger
  })
  const spIdToChainInfoMap = await getMapOfSpIdToChainInfo()
  return {
    primary: replicaSetSpIds.primaryId
      ? spIdToChainInfoMap.get(replicaSetSpIds.primaryId!)?.endpoint
      : undefined,
    secondary1: replicaSetSpIds.secondaryIds?.[0]
      ? spIdToChainInfoMap.get(replicaSetSpIds.secondaryIds[0])?.endpoint
      : undefined,
    secondary2: replicaSetSpIds.secondaryIds?.[1]
      ? spIdToChainInfoMap.get(replicaSetSpIds.secondaryIds[1])?.endpoint
      : undefined
  }
}

async function _initLibsAndGetEthContracts(
  logger: Logger
): Promise<EthContracts> {
  const audiusLibs = await initAudiusLibs({
    enableEthContracts: true,
    enableContracts: false,
    enableDiscovery: false,
    enableIdentity: false,
    logger
  })
  return audiusLibs.ethContracts
}

export type EthContracts = {
  getServiceProviderList: (spType: string) => Promise<LibsServiceProvider[]>
}
export type LibsServiceProvider = {
  owner: any // Libs typed this as any, but the contract has it as address
  delegateOwnerWallet: any // Libs typed this as any, but the contract has it as address
  endpoint: any // Libs typed this as any, but the contract has it as string
  spID: number
  type: string
  blockNumber: number
}
export type ContentNodeFromChain = {
  endpoint: string
  delegateOwnerWallet: string
}
export {
  updateContentNodeChainInfo,
  getMapOfSpIdToChainInfo,
  getMapOfCNodeEndpointToSpId,
  getSpIdFromEndpoint,
  getContentNodeInfoFromSpId
}
module.exports = {
  updateContentNodeChainInfo,
  getMapOfSpIdToChainInfo,
  getMapOfCNodeEndpointToSpId,
  getSpIdFromEndpoint,
  getContentNodeInfoFromSpId
}
