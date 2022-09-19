import type Logger from 'bunyan'

import config from '../config'
const redis = require('../redis')

const THIRTY_MINUTES_IN_SECONDS = 60 * 30

/**
 * Get all Content Nodes registered on chain, excluding self
 * Fetches from Redis if available, else fetches from chain and updates Redis value
 * @returns {Object[]} array of SP objects with schema { owner, endpoint, spID, type, blockNumber, delegateOwnerWallet }
 */
export async function getAllRegisteredCNodes(libs: any, logger?: Logger) {
  const cacheKey = 'all_registered_cnodes'

  let CNodes
  try {
    // Fetch from Redis if present
    const cnodesList = await redis.get(cacheKey)
    if (cnodesList) {
      return JSON.parse(cnodesList)
    }

    // Else, fetch from chain
    let creatorNodes =
      await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(
        'content-node'
      )

    // Filter out self endpoint
    creatorNodes = creatorNodes.filter(
      (node: { endpoint: string }) =>
        node.endpoint !== config.get('creatorNodeEndpoint')
    )

    // Write fetched value to Redis with 30min expiry
    await redis.set(
      cacheKey,
      JSON.stringify(creatorNodes),
      'EX',
      THIRTY_MINUTES_IN_SECONDS
    )

    CNodes = creatorNodes
  } catch (e: any) {
    if (logger) {
      logger.error(
        `Error getting values in getAllRegisteredCNodes: ${e.message}`
      )
    } else {
      console.error(
        `Error getting values in getAllRegisteredCNodes: ${e.message}`
      )
    }

    CNodes = []
  }

  return CNodes
}

/**
 * A current node should handle a track transcode if there is enough room in the TranscodingQueue to accept more jobs
 *
 * If there is not enough room, if the spID is not set after app init, then the current node should still accept the transcode task
 * @param {Object} param
 * @param {boolean} param.transcodingQueueCanAcceptMoreJobs flag to determine if TranscodingQueue can accept more jobs
 * @param {number} param.spID the spID of the current node
 * @returns whether or not the current node can handle the transcode
 */
export function currentNodeShouldHandleTranscode({
  transcodingQueueCanAcceptMoreJobs,
  spID
}: {
  transcodingQueueCanAcceptMoreJobs: boolean
  spID: number
}) {
  // If the TranscodingQueue is available, let current node handle transcode
  if (transcodingQueueCanAcceptMoreJobs) return true

  // Else, if spID is not initialized, the track cannot be handed off to another node to transcode.
  // Continue with the upload on the current node.
  const currentNodeShouldHandleTranscode = !Number.isInteger(spID)

  return currentNodeShouldHandleTranscode
}
