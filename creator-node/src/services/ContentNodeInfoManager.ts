import type Logger from 'bunyan'

import _ from 'lodash'
// TODO: Use _.invert()

import initAudiusLibs from './initAudiusLibs'
import { logger as defaultLogger } from '../logging'
import defaultRedisClient from '../redis'
import { Redis } from 'ioredis'

// type EthContractsType = InstanceType<typeof libs>['myMethod']
export type EthContractsType = {
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
export interface IContentNodeInfoManager {
  getSpIdToChainInfo: () => Promise<Map<number, ContentNodeFromChain>>
  getEndpointToSpId: () => Promise<Map<string, number>> // TODO: Implement
  getContentNodeInfoFromSpId: (
    spId: number
  ) => Promise<ContentNodeFromChain | undefined>
}

const SP_ID_TO_CHAIN_INFO_MAP_KEY = 'contentNodeInfoManagerSpIdMap'

function ContentNodeInfoManager(
  logger = defaultLogger,
  redisClient = defaultRedisClient,
  makeEthContracts: () => Promise<EthContractsType> = _makeEthContracts(logger),
  cacheTtlSeconds = 10 * 60, // 10 minutes
  ignoreCache = false
): IContentNodeInfoManager {
  return {
    async getSpIdToChainInfo(): Promise<Map<number, ContentNodeFromChain>> {
      try {
        // Return cached mapping from redis if it's present and non-empty
        if (!ignoreCache) {
          const spIdToChainInfoFromRedis = await _getContentNodeInfoFromRedis(
            logger,
            redisClient
          )
          if (!_.isEmpty(spIdToChainInfoFromRedis))
            return spIdToChainInfoFromRedis
        }

        // Since we didn't have a non-empty mapping cached, fetch mapping from chain and cache it
        const spIdToChainInfoFromChain: Map<number, ContentNodeFromChain> =
          await _getContentNodeInfoFromChain(logger, makeEthContracts)
        redisClient.set(
          SP_ID_TO_CHAIN_INFO_MAP_KEY,
          JSON.stringify(Array.from(spIdToChainInfoFromChain.entries()))
        )
        redisClient.expire(SP_ID_TO_CHAIN_INFO_MAP_KEY, cacheTtlSeconds)
        return spIdToChainInfoFromChain
      } catch (e: any) {
        logger.error(
          `ContentNodeInfoManager error: Failed to fetch mapping: ${e.message}: ${e.stack}`
        )
        return new Map()
      }
    },

    async getContentNodeInfoFromSpId(
      spId: number
    ): Promise<ContentNodeFromChain | undefined> {
      const map = await this.getSpIdToChainInfo()
      return map.get(spId)
    }
  }
}

function _makeEthContracts(logger: Logger) {
  return async function (): Promise<EthContractsType> {
    const audiusLibs = await initAudiusLibs({
      enableEthContracts: true,
      enableContracts: false,
      enableDiscovery: false,
      enableIdentity: false,
      logger
    })
    return audiusLibs.ethContracts
  }
}

async function _getContentNodeInfoFromChain(
  logger: Logger,
  makeEthContracts: () => Promise<EthContractsType>
): Promise<Map<number, ContentNodeFromChain>> {
  try {
    const ethContracts = await makeEthContracts()
    const contentNodesFromLibs: LibsServiceProvider[] =
      (await ethContracts.getServiceProviderList('content-node')) || []
    return new Map(
      contentNodesFromLibs.map((cn) => [
        cn.spID,
        _.pick(cn, ['endpoint', 'delegateOwnerWallet'])
      ])
    )
  } catch (e: any) {
    logger.error(`Failed to fetch content nodes from chain: ${e.message}`)
    return new Map()
  }
}

async function _getContentNodeInfoFromRedis(
  logger: Logger,
  redisClient: Redis
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

export { ContentNodeInfoManager }
module.exports = { ContentNodeInfoManager }
