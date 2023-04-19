import type { Logger } from './types'
import { sampleSize } from 'lodash'
import RendezvousHash from './rendezvous'

type StorageNode = {
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
    const nodes = numNodes ? sampleSize(allNodes, numNodes) : allNodes
    const nodeOwnerWallets = nodes.map((n) => n.delegateOwnerWallet)
    let orderedNodes = nodes
    if (rendezvousKey?.length) {
      const hash = new RendezvousHash(...nodeOwnerWallets)
      const orderedOwnerWallets = hash.getN(numNodes, rendezvousKey)
      orderedNodes = orderedOwnerWallets.map((ownerWallet) => {
        return nodes.find((n) => n.delegateOwnerWallet === ownerWallet)!
      })
    }

    if (!orderedNodes.length || (numNodes && orderedNodes.length < numNodes)) {
      logger.error(
        `getNStorageNodes: Could not select ${numNodes} nodes from ${allNodes.length} nodes`
      )
    }
    return orderedNodes.map((n) => n.endpoint)
  } catch (e) {
    logger.error(`getNStorageNodes: Error selecting nodes: ${e}`)
    return []
  }
}
