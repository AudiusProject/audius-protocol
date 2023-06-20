/**
 * Util functions for fetching+updating the redis cache of info about content nodes.
 * Maintains a bidirectional mappings of SP ID <--> chain info (endpoint and delegateOwnerWallet).
 * TODO: Rename this to SpInfoManager and cache Discovery Nodes
 */

import type Logger from 'bunyan'
import type {
  ContentNodeFromChain,
  EthContracts,
  ReplicaSetSpIds,
  ReplicaSetEndpoints
} from './types'

import { pick, isEmpty } from 'lodash'

import initAudiusLibs from './initAudiusLibs'
import { createChildLogger } from '../logging'
import defaultRedisClient from '../redis'
import { timeout } from '../utils'
import { asyncRetry } from '../utils/asyncRetry'

const SP_ID_TO_CHAIN_INFO_MAP_KEY = 'contentNodeInfoManagerSpIdMap'

/**
 * Updates redis cache of registered content nodes. Note that this queries ALL
 * content nodes via ethContracts.getServiceProviderList.
 */
export async function updateContentNodeChainInfo(
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
        pick(cn, ['endpoint', 'owner', 'delegateOwnerWallet'])
      ])
    )
    if (spIdToChainInfoFromChain.size > 0) {
      await redisClient.set(
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

export async function getAllRegisteredCNodes(
  logger: Logger,
  redisClient = defaultRedisClient
) {
  const spIdToCNodeMap = await getMapOfSpIdToChainInfo(logger, redisClient)
  return Array.from(spIdToCNodeMap.values())
}

export async function getMapOfSpIdToChainInfo(
  logger: Logger,
  redisClient = defaultRedisClient
): Promise<Map<number, ContentNodeFromChain>> {
  try {
    const serializedMapFromRedis = await redisClient.get(
      SP_ID_TO_CHAIN_INFO_MAP_KEY
    )
    if (isEmpty(serializedMapFromRedis)) return new Map()
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

export async function getMapOfCNodeEndpointToSpId(
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

export async function getSpIdFromEndpoint(
  endpoint: string,
  logger: Logger,
  redisClient = defaultRedisClient
): Promise<number | undefined> {
  const cNodeEndpointToSpIdMap: Map<string, number> =
    await getMapOfCNodeEndpointToSpId(logger, redisClient)
  return cNodeEndpointToSpIdMap.get(endpoint)
}

export async function getContentNodeInfoFromSpId(
  spId: number,
  logger: Logger,
  redisClient = defaultRedisClient
): Promise<ContentNodeFromChain | undefined> {
  const spIdToChainInfoMap = await getMapOfSpIdToChainInfo(logger, redisClient)
  return spIdToChainInfoMap.get(spId)
}

export async function getContentNodeInfoFromEndpoint(
  endpoint: string,
  logger: Logger,
  redisClient = defaultRedisClient
): Promise<ContentNodeFromChain | undefined> {
  const endpointToSpIdMap = await getMapOfCNodeEndpointToSpId(
    logger,
    redisClient
  )
  const spId = endpointToSpIdMap.get(endpoint)
  if (spId === undefined) return undefined
  const cNodeInfo = await getContentNodeInfoFromSpId(spId, logger, redisClient)
  return cNodeInfo
}

export async function getReplicaSetSpIdsByUserId({
  libs,
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
    const MAX_RETRIES = 7

    let errorMsg = null
    await asyncRetry({
      logLabel: 'getReplicaSetSpIdsByUserId',
      options: {
        retries: MAX_RETRIES
      },
      asyncFn: async () => {
        try {
          // Still throw error if blocknumber not found
          const encodedUserId = libs.Utils.encodeHashId(userId)
          const spResponse = await libs.discoveryProvider.getUserReplicaSet({
            encodedUserId,
            blockNumber
          })

          if (!spResponse) throw new Error('no spResponse')
          if (spResponse.primarySpID) {
            replicaSet = {
              primaryId: spResponse.primarySpID,
              secondaryIds: [
                spResponse.secondary1SpID,
                spResponse.secondary2SpID
              ]
            }
            errorMsg = null
            return
          } else {
            // The blocknumber was indexed by discovery, but there's still no user replica set returned
            errorMsg = 'User replica not found in discovery'
            return
          }
        } catch (e: any) {
          errorMsg = e.message
          throw e
        }
      }
    })

    // Error if indexed blockNumber but didn't find any replicaSet for user
    if (!replicaSet.primaryId) {
      throw new Error(
        `ERROR || Failed to retrieve user from EntityManager. Aborting. Error: ${errorMsg}`
      )
    }
  } else if (ensurePrimary && selfSpId) {
    /**
     * If ensurePrimary required but no blockNumber provided, poll contract until returned primary = selfSpID
     * Error if still mismatched after specified timeout
     */

    const MAX_RETRIES = 7
    let errorMsg = null
    await asyncRetry({
      logLabel: 'getReplicaSetSpIdsByUserId',
      options: {
        retries: MAX_RETRIES
      },
      asyncFn: async () => {
        try {
          const encodedUserId = libs.Utils.encodeHashId(userId)
          const spResponse = await libs.discoveryProvider.getUserReplicaSet({
            encodedUserId
          })

          if (spResponse?.primarySpID) {
            replicaSet = {
              primaryId: spResponse.primarySpID,
              secondaryIds: [
                spResponse.secondary1SpID,
                spResponse.secondary2SpID
              ]
            }
            errorMsg = null
            if (replicaSet.primaryId === selfSpId) return
          } else {
            errorMsg = 'User replica not found in discovery'
            throw new Error(errorMsg)
          }
        } catch (e: any) {
          errorMsg = e.message
          throw e
        }
      }
    })

    // Error if failed to retrieve replicaSet
    if (!replicaSet.primaryId) {
      throw new Error(
        `ERROR || Failed to retrieve user from UserReplicaSetManager. Aborting. Error ${errorMsg}`
      )
    }

    // Error if returned primary spID does not match self spID
    if (replicaSet.primaryId !== selfSpId) {
      throw new Error(
        `ERROR || Found different primary (${replicaSet.primaryId}) for user. Aborting.`
      )
    }
  } else {
    /**
     * If neither of above conditions are met, falls back to single call without polling
     */

    logger.info(
      `ensurePrimary = false, fetching user replicaSet without retries`
    )

    let errorMsg = null
    try {
      const encodedUserId = libs.Utils.encodeHashId(userId)
      const spResponse = await libs.discoveryProvider.getUserReplicaSet({
        encodedUserId
      })

      if (spResponse && spResponse.primarySpID) {
        replicaSet = {
          primaryId: spResponse.primarySpID,
          secondaryIds: [spResponse.secondary1SpID, spResponse.secondary2SpID]
        }
      }
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

export async function getReplicaSetEndpointsByWallet({
  libs,
  wallet,
  parentLogger
}: GetReplicaSetEndpointsByWalletParams): Promise<ReplicaSetEndpoints> {
  const userAsc: { user_id: number }[] = await libs.User.getUsers(
    1000,
    0,
    null,
    wallet
  )
  const user = userAsc[userAsc.length - 1]
  const replicaSetEndpoints = await getReplicaSetEndpointsByUserId({
    libs,
    userId: user.user_id,
    parentLogger
  })
  return replicaSetEndpoints
}

export async function getReplicaSetEndpointsByUserId({
  libs,
  userId,
  parentLogger
}: GetReplicaSetEndpointsByUserIdParams): Promise<ReplicaSetEndpoints> {
  const replicaSetSpIds = await getReplicaSetSpIdsByUserId({
    libs,
    userId,
    parentLogger
  })
  const replicaSetEndpoints = await replicaSetSpIdsToEndpoints(
    replicaSetSpIds,
    parentLogger
  )
  return replicaSetEndpoints
}

export async function replicaSetSpIdsToEndpoints(
  replicaSetSpIds: ReplicaSetSpIds,
  logger: Logger
): Promise<ReplicaSetEndpoints> {
  const spIdToChainInfoMap = await getMapOfSpIdToChainInfo(logger)
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

/**
 * @deprecated Remove when URSM is no longer used in prod.
 * Same code as getReplicaSetSpIdsByUserId but calls URSM instead of EntityManager.
 */
async function _getReplicaSetSpIdsByUserIdUrsm({
  libs,
  userId,
  blockNumber,
  ensurePrimary,
  selfSpId,
  parentLogger
}: GetReplicaSetSpIdsByUserIdParams): Promise<ReplicaSetSpIds> {
  const start = Date.now()
  const logger = createChildLogger(parentLogger, {
    function: '_getReplicaSetSpIdsByUserIdUrsm',
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
    for (let retry = 1; retry <= MAX_RETRIES; retry++) {
      logger.info(
        `retry #${retry}/${MAX_RETRIES} || time from start: ${
          Date.now() - start
        }. Polling until blockNumber ${blockNumber}.`
      )

      try {
        // will throw error if blocknumber not found
        replicaSet =
          await libs.contracts.UserReplicaSetManagerClient.getUserReplicaSetAtBlockNumber(
            userId,
            blockNumber
          )
        errorMsg = null
        break
      } catch (e: any) {
        errorMsg = e.message
      } // Ignore all errors until MAX_RETRIES exceeded

      await timeout(RETRY_TIMEOUT_MS)
    }

    // Error if indexed blockNumber but didn't find any replicaSet for user
    if (!replicaSet.primaryId) {
      throw new Error(
        `ERROR || Failed to retrieve user from UserReplicaSetManager after ${MAX_RETRIES} retries. Aborting. ${errorMsg}`
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
        replicaSet =
          await libs.contracts.UserReplicaSetManagerClient.getUserReplicaSet(
            userId
          )

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
      replicaSet =
        await libs.contracts.UserReplicaSetManagerClient.getUserReplicaSet(
          userId
        )
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

export type GetReplicaSetSpIdsByUserIdParams = {
  libs: any
  userId: number
  blockNumber?: number
  ensurePrimary?: boolean
  selfSpId?: number
  parentLogger: Logger
}
export type GetReplicaSetEndpointsByWalletParams = {
  libs: any
  wallet: string
  parentLogger: Logger
}
export type GetReplicaSetEndpointsByUserIdParams = {
  libs: any
  userId: number
  parentLogger: Logger
}
