import { productionConfig } from '../../config/production'
import fetch from '../../utils/fetch'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import { RendezvousHash } from '../../utils/rendezvous'
import type { AudiusWalletClient } from '../AudiusWalletClient'
import type { DiscoveryNodeSelectorService } from '../DiscoveryNodeSelector'
import type { HealthCheckResponseData } from '../DiscoveryNodeSelector/healthCheckTypes'
import type { LoggerService } from '../Logger'

import { getDefaultStorageNodeSelectorConfig } from './getDefaultConfig'
import { isNodeHealthy } from './getNStorageNodes'
import type {
  StorageNode,
  StorageNodeSelectorConfig,
  StorageNodeSelectorConfigInternal,
  StorageNodeSelectorService
} from './types'

const DISCOVERY_RESPONSE_TIMEOUT = 15000

export class StorageNodeSelector implements StorageNodeSelectorService {
  private readonly config: StorageNodeSelectorConfigInternal
  private readonly auth: AudiusWalletClient
  private readonly logger: LoggerService
  private nodes: StorageNode[]
  private orderedNodes?: string[] // endpoints (lowercase)
  private selectedNode?: string | null
  private selectedDiscoveryNode?: string | null
  private selectionState: 'healthy_only' | 'failed_all'
  private readonly discoveryNodeSelector?: DiscoveryNodeSelectorService
  private readonly initialDiscoveryFetchPromise: Promise<void>
  private resolveInitialDiscoveryFetchPromise: () => void = () => {}

  constructor(config: StorageNodeSelectorConfig) {
    this.config = mergeConfigWithDefaults(
      config,
      getDefaultStorageNodeSelectorConfig(productionConfig)
    )
    this.discoveryNodeSelector = config.discoveryNodeSelector
    this.auth = config.auth

    this.logger = this.config.logger.createPrefixedLogger(
      '[storage-node-selector]'
    )
    this.nodes = this.config.bootstrapNodes ?? []
    this.selectionState = 'healthy_only'

    this.discoveryNodeSelector?.addEventListener(
      'change',
      this.onChangeDiscoveryNode.bind(this)
    )

    this.checkIfDiscoveryNodeAlreadyAvailable()
    this.initialDiscoveryFetchPromise = new Promise((resolve) => {
      this.resolveInitialDiscoveryFetchPromise = resolve
    })
  }

  private async checkIfDiscoveryNodeAlreadyAvailable() {
    const endpoint = await this.discoveryNodeSelector?.getSelectedEndpoint()
    if (endpoint) {
      this.onChangeDiscoveryNode(endpoint)
    }
  }

  private async onChangeDiscoveryNode(endpoint: string) {
    this.logger.info('Updating list of available content nodes')
    if (this.selectedDiscoveryNode === endpoint) return
    this.selectedDiscoveryNode = endpoint
    const healthCheckEndpoint = `${endpoint}/health_check`
    const discoveryHealthCheckResponse = await fetch(healthCheckEndpoint)
    if (!discoveryHealthCheckResponse.ok) {
      this.logger.warn(
        'Discovery provider health check did not respond successfully'
      )
      return
    }

    const responseData: { data: HealthCheckResponseData } =
      await discoveryHealthCheckResponse.json()
    const contentNodes = responseData.data.network?.content_nodes

    if (!contentNodes) {
      this.logger.warn(
        'Discovery provider health check did not contain any available content nodes'
      )
      return
    }

    this.nodes = contentNodes
    this.selectionState = 'healthy_only'
    this.resolveInitialDiscoveryFetchPromise()
  }

  public async getSelectedNode(forceReselect = false) {
    if (this.selectedNode && !forceReselect) {
      return this.selectedNode
    }

    // If we don't have any nodes, wait for a
    // discovery response to come back first
    if (!this.nodes.length) {
      await Promise.race([
        this.initialDiscoveryFetchPromise,
        new Promise<void>((resolve) =>
          setTimeout(() => {
            this.logger.warn('List of storage nodes could not be fetched')
            resolve()
          }, DISCOVERY_RESPONSE_TIMEOUT)
        )
      ])
    }

    return await this.select()
  }

  public triedSelectingAllNodes() {
    return this.selectionState === 'failed_all'
  }

  public getNodes(cid: string) {
    return this.orderNodes(cid)
  }

  private async select(): Promise<string | null | undefined> {
    // We've selected all healthy nodes. Restart from the beginning of the ordered list
    if (this.selectionState === 'failed_all') {
      this.selectionState = 'healthy_only'
    }

    // Select the next node in rendezvous order from the list of all nodes
    this.selectedNode = (await this.selectUntilEndOfList()) ?? null
    this.logger.info('Selected content node', this.selectedNode)

    if (!this.selectedNode) {
      // We've selected all healthy nodes. Return null and start over next time select() is called
      this.logger.info(
        'Selected all healthy nodes. Returning null and starting over next time select() is called'
      )
      this.selectionState = 'failed_all'
    }

    return this.selectedNode
  }

  private async selectUntilEndOfList(): Promise<string | undefined> {
    if (!this.orderedNodes?.length) {
      this.orderedNodes = this.orderNodes(
        (await this.auth.getAddress()).toLowerCase()
      )
    }

    if (this.orderedNodes.length === 0) {
      return undefined
    }

    const currentNodeIndex = this.selectedNode
      ? this.orderedNodes.indexOf(this.selectedNode)
      : -1

    let selectedNode: string | undefined
    let nextNodeIndex = currentNodeIndex

    while (nextNodeIndex !== this.orderedNodes.length - 1) {
      nextNodeIndex++
      const nextNode = this.orderedNodes[nextNodeIndex]
      if (!nextNode) continue // should never happen unless this.orderedNodes has falsy values
      if (await isNodeHealthy(nextNode)) {
        selectedNode = nextNode
        break
      }
    }

    return selectedNode
  }

  private orderNodes(key: string) {
    const endpoints = this.nodes.map((node) => node.endpoint.toLowerCase())
    const hash = new RendezvousHash(...endpoints)
    return hash.getN(this.nodes.length, key)
  }
}
