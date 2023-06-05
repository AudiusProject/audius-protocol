import { Maybe, RendezvousHash, isNodeHealthy } from '../../../utils'
import fetch from 'cross-fetch'
import type { DiscoveryNodeSelector } from '../DiscoveryNodeSelector'
import type { HealthCheckResponseData } from '../DiscoveryNodeSelector/healthCheckTypes'
import type { Auth } from '../Auth'
import type { StorageNodeSelectorService } from './types'

type StorageNode = {
  endpoint: string
  ownerDelegateWallet: string
}

export type StorageNodeSelectorConfig = {
  bootstrapNodes?: StorageNode[]
  auth: Auth
  discoveryNodeSelector?: DiscoveryNodeSelector
}

export class StorageNodeSelector implements StorageNodeSelectorService {
  private readonly config: StorageNodeSelectorConfig
  private readonly auth: Auth
  private nodes: StorageNode[]
  private orderedNodes?: StorageNode[]
  private selectedNode?: string | null
  private selectedDiscoveryNode?: string | null
  private readonly discoveryNodeSelector?: DiscoveryNodeSelector

  constructor(config: StorageNodeSelectorConfig) {
    this.config = config
    this.auth = this.config.auth
    this.nodes = this.config.bootstrapNodes ?? []
    this.discoveryNodeSelector = this.config.discoveryNodeSelector

    this.discoveryNodeSelector?.addEventListener(
      'change',
      this.onChangeDiscoveryNode.bind(this)
    )

    this.checkIfDiscoveryNodeAlreadyAvailable()
  }

  private async checkIfDiscoveryNodeAlreadyAvailable() {
    const endpoint = await this.discoveryNodeSelector?.getSelectedEndpoint()
    if (endpoint) {
      this.onChangeDiscoveryNode(endpoint)
    }
  }

  private async onChangeDiscoveryNode(endpoint: string) {
    if (this.selectedDiscoveryNode === endpoint) return
    this.selectedDiscoveryNode = endpoint
    const healthCheckEndpoint = `${endpoint}/health_check`
    const discoveryHealthCheckResponse = await fetch(healthCheckEndpoint)
    if (!discoveryHealthCheckResponse.ok) return

    const responseData: { data: HealthCheckResponseData } =
      await discoveryHealthCheckResponse.json()
    const contentNodes = responseData.data.network?.content_nodes

    if (!contentNodes) return

    this.nodes = contentNodes
  }

  public async getSelectedNode() {
    if (this.selectedNode) {
      return this.selectedNode
    }
    return await this.select()
  }

  private async select() {
    if (!this.orderedNodes) {
      this.orderedNodes = await this.orderNodes()
    }

    if (this.orderedNodes.length === 0) {
      return null
    }

    const currentNodeIndex = this.selectedNode
      ? this.orderedNodes
          .map((node) => node.endpoint)
          .indexOf(this.selectedNode)
      : -1

    let selectedNode: Maybe<string>
    let nextNodeIndex = currentNodeIndex

    while (!selectedNode) {
      nextNodeIndex = (nextNodeIndex + 1) % this.orderedNodes.length
      if (nextNodeIndex === currentNodeIndex) break
      const nextNode = this.orderedNodes[nextNodeIndex]?.endpoint
      if (!nextNode) continue
      if (await isNodeHealthy(nextNode)) {
        selectedNode = nextNode
      }
    }

    this.selectedNode = selectedNode
    return this.selectedNode ?? null
  }

  private async orderNodes() {
    const userAddress = await this.auth.getAddress()
    const nodeOwnerWallets = this.nodes.map((node) => node.ownerDelegateWallet)
    const hash = new RendezvousHash(...nodeOwnerWallets)
    const orderedOwnerWallets = hash.getN(this.nodes.length, userAddress)
    const orderedNodes = orderedOwnerWallets.map((ownerWallet) => {
      const index = nodeOwnerWallets.indexOf(ownerWallet)
      return this.nodes[index] as StorageNode
    })
    return orderedNodes
  }
}
