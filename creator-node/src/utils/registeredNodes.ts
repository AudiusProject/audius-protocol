import type Logger from 'bunyan'
import { Redis } from 'ioredis'

const THIRTY_MINUTES_IN_SECONDS = 60 * 30

type Service = {
  owner: string
  endpoint: string
  spID: number
  type: 'discovery-node' | 'content-node'
  blockNumber: number
  delegateOwnerWallet: string
}

/**
 * Get all Discovery Nodes registered on chain
 * Fetches from Redis if available, else fetches from chain and updates Redis value
 * @returns {Promise<Service[]>} array of SP objects with schema { owner, endpoint, spID, type, blockNumber, delegateOwnerWallet }
 */
export const getAllRegisteredDNodes = async ({
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
  try {
    // Fetch from Redis if present
    const dnodesList = await redis.get(cacheKey)
    if (dnodesList) {
      return JSON.parse(dnodesList)
    }

    // Else, fetch from chain
    const discoveryNodes =
      await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(
        'discovery-node'
      )

    // Write fetched value to Redis with 30min expiry
    await redis.set(
      cacheKey,
      JSON.stringify(discoveryNodes),
      'EX',
      THIRTY_MINUTES_IN_SECONDS
    )

    DNodes = discoveryNodes
  } catch (e) {
    logger.error(
      `registeredNodes | Error getting values in getAllRegisteredDNodes: ${
        (e as Error).message
      }`
    )

    DNodes = []
  }

  return DNodes
}
