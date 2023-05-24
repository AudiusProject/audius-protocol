import axios from 'axios'
import type { Logger } from './types'
import RendezvousHash from './rendezvous'

export type StorageNode = {
  owner: any
  endpoint: string
  spID: number
  type: string
  blockNumber: number
  delegateOwnerWallet: string
}

/**
 * Selects numNodes storage nodes from the given list of allNodes, optionally ordering them (descending) by rendezvous score.
 */
export const getNStorageNodes = async (
  allNodes: StorageNode[],
  numNodes = 0,
  rendezvousKey = '',
  logger: Logger = console
): Promise<string[]> => {
  try {
    if (numNodes === 0) numNodes = allNodes.length
    const nodeOwnerWallets = allNodes.map((n) => n.delegateOwnerWallet)
    let endpoints: string[]

    // Sort endpoints by rendezvous score if a rendezvous key is provided
    if (rendezvousKey?.length) {
      const hash = new RendezvousHash(...nodeOwnerWallets)
      const orderedOwnerWallets = hash.getN(numNodes, rendezvousKey)
      endpoints = orderedOwnerWallets.map((ownerWallet) => {
        return allNodes.find((n) => n.delegateOwnerWallet === ownerWallet)!.endpoint
      })
    } else {
      endpoints = allNodes.map((n) => n.endpoint)
    }

    // Check multiple nodes at a time for health until we have numNodes healthy nodes
    const healthyEndpoints: string[] = []
    for (let i = 0; i < endpoints.length; i += numNodes) {
      const batch = endpoints.slice(i, i + numNodes)
      const healthCheckPromises = batch.map((endpoint) => isNodeHealthy(endpoint, logger))
      const healthCheckResults = await Promise.all(healthCheckPromises)

      for (let j = 0; j < healthCheckResults.length; j++) {
        if (healthCheckResults[j]) {
          healthyEndpoints.push(batch[j]!)
        }
      }
    }

    if (numNodes !== allNodes.length && endpoints.length < numNodes) {
      logger.error(
        `getNStorageNodes: Could not select ${numNodes} healthy nodes from ${allNodes.length} nodes`
      )
    }

    return healthyEndpoints
  } catch (e) {
    logger.error(`getNStorageNodes: Error selecting nodes: ${e}`)
    return []
  }
}

export const isNodeHealthy = async (endpoint: string, logger: Logger = console) => {
  try {
    const resp = await axios({
      baseURL: endpoint,
      url: `/status`,
      method: 'get',
      timeout: 3000
    })
    if (resp.status === 200) return true
    else {
      logger.warn(`isNodeHealthy: ${endpoint} returned non-200 status ${resp.status}`)
      return false
    }
  } catch (e) {
    logger.error(`isNodeHealthy: Error checking health: ${e}`)
    return false
  }
}
