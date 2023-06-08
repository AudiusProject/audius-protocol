import { Maybe, RendezvousHash, isNodeHealthy } from '../../../utils'
import fetch from 'cross-fetch'
import type { DiscoveryNodeSelectorService } from '../DiscoveryNodeSelector'
import type { HealthCheckResponseData } from '../DiscoveryNodeSelector/healthCheckTypes'
import type { AuthService } from '../Auth'
import type {
  StorageNode,
  StorageNodeSelectorConfig,
  StorageNodeSelectorService
} from './types'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import { defaultStorageNodeSelectorConfig } from './constants'

export class StorageNodeSelector implements StorageNodeSelectorService {
  private readonly config: StorageNodeSelectorConfig
  private readonly auth: AuthService
  private nodes: StorageNode[]
  private orderedNodes?: StorageNode[]
  private selectedNode?: string | null
  private selectedDiscoveryNode?: string | null
  private readonly discoveryNodeSelector?: DiscoveryNodeSelectorService

  constructor(config: StorageNodeSelectorConfig) {
    this.config = mergeConfigWithDefaults(
      config,
      defaultStorageNodeSelectorConfig
    )
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
    this.info('Updating list of available content nodes')
    if (this.selectedDiscoveryNode === endpoint) return
    this.selectedDiscoveryNode = endpoint
    const healthCheckEndpoint = `${endpoint}/health_check`
    const discoveryHealthCheckResponse = await fetch(healthCheckEndpoint)
    if (!discoveryHealthCheckResponse.ok) {
      this.warn('Discovery provider health check did not respond successfully')
      return
    }

    const responseData: { data: HealthCheckResponseData } =
      await discoveryHealthCheckResponse.json()
    const contentNodes = responseData.data.network?.content_nodes

    if (!contentNodes) {
      this.warn(
        'Discovery provider health check did not contain any available content nodes'
      )
      return
    }

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
    this.info('Selected content node', this.selectedNode)
    return this.selectedNode ?? null
  }

  private async orderNodes() {
    const userAddress = await this.auth.getAddress()
    const nodeOwnerWallets = this.nodes.map((node) => node.delegateOwnerWallet)
    const hash = new RendezvousHash(...nodeOwnerWallets)
    const orderedOwnerWallets = hash.getN(this.nodes.length, userAddress)
    const orderedNodes = orderedOwnerWallets.map((ownerWallet) => {
      const index = nodeOwnerWallets.indexOf(ownerWallet)
      return this.nodes[index] as StorageNode
    })
    return orderedNodes
  }

  /** console.info proxy utility to add a prefix */
  private info(...args: any[]) {
    console.info('[audius-sdk][storage-node-selector]', ...args)
  }

  /** console.warn proxy utility to add a prefix */
  private warn(...args: any[]) {
    console.warn('[audius-sdk][storage-node-selector]', ...args)
  }
}
