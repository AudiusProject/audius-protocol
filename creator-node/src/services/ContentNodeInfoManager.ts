import type Logger from 'bunyan'

import _ from 'lodash'

import initAudiusLibs from './initAudiusLibs'
import { logger as defaultLogger } from '../logging'
import defaultRedisClient from '../redis'

const SP_ID_TO_CHAIN_INFO_MAP_KEY = 'contentNodeInfoManagerSpIdMap'

// TODO: Make this into SpInfoManager and cache DNs too

async function updateContentNodeChainInfo(
  logger = defaultLogger,
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
    redisClient.set(
      SP_ID_TO_CHAIN_INFO_MAP_KEY,
      JSON.stringify(Array.from(spIdToChainInfoFromChain.entries()))
    )
  } catch (e: any) {
    logger.error(
      `Failed to fetch content nodes from chain and update mapping: ${e.message}`
    )
  }
}

async function getMapOfSpIdToChainInfo(
  logger = defaultLogger,
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
  logger = defaultLogger,
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
  logger = defaultLogger,
  redisClient = defaultRedisClient
): Promise<number | undefined> {
  const cNodeEndpointToSpIdMap: Map<string, number> =
    await getMapOfCNodeEndpointToSpId(logger, redisClient)
  return cNodeEndpointToSpIdMap.get(endpoint)
}

async function getContentNodeInfoFromSpId(
  spId: number,
  logger = defaultLogger,
  redisClient = defaultRedisClient
): Promise<ContentNodeFromChain | undefined> {
  const map = await getMapOfSpIdToChainInfo(logger, redisClient)
  return map.get(spId)
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
