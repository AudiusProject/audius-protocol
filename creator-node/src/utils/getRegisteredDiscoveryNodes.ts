import type Logger from 'bunyan'
import { Redis } from 'ioredis'
import { asyncRetry } from './asyncRetry'

const THIRTY_MINUTES_IN_SECONDS = 60 * 30

type Service = {
  owner: string
  endpoint: string
  spID: number
  type: 'discovery-node'
  blockNumber: number
  delegateOwnerWallet: string
}

/**
 * Get all Discovery Nodes registered on chain
 * Fetches from Redis if available, else fetches from chain and updates Redis value
 * @returns {Promise<Service[]>} array of SP objects with schema { owner, endpoint, spID, type, blockNumber, delegateOwnerWallet }
 */
export const getRegisteredDiscoveryNodes = async ({
  libs,
  logger,
  redis
}: {
  libs: any
  logger: Logger
  redis: Redis
}): Promise<Service[]> => {
  const cacheKey = 'all_registered_dnodes'

  let DNodes

  // Fetch from Redis if present
  try {
    const dnodesList = await redis.get(cacheKey)
    if (dnodesList) {
      return JSON.parse(dnodesList)
    }
  } catch (e) {
    logger.error(
      `registeredNodes | Error reading discovery nodes from redis: ${
        (e as Error).message
      }`
    )
  }

  // Else, fetch from chain
  try {
    DNodes = await asyncRetry({
      asyncFn: async () => {
        return libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(
          'discovery-node'
        )
      },
      logger,
      logLabel: 'fetch all the registered discovery nodes'
    })
  } catch (e) {
    logger.error(
      `registeredNodes | Error fetching registered discovery nodes: ${
        (e as Error).message
      }`
    )
    return []
  }

  // Write fetched value to Redis with 30min expiry
  try {
    await redis.set(
      cacheKey,
      JSON.stringify(DNodes),
      'EX',
      THIRTY_MINUTES_IN_SECONDS
    )
  } catch (e) {
    logger.error(
      `registeredNodes | Error writing discovery nodes to redis: ${
        (e as Error).message
      }`
    )
  }

  return DNodes
}
