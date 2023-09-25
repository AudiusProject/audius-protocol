import fetch from 'cross-fetch'

import { isNodeHealthy } from '../../../utils/getNStorageNodes'
import RendezvousHash from '../../../utils/rendezvous'
import type { Maybe } from '../../../utils/types'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import type { AuthService } from '../Auth'
import type { DiscoveryNodeSelectorService } from '../DiscoveryNodeSelector'
import type { HealthCheckResponseData } from '../DiscoveryNodeSelector/healthCheckTypes'
import type { LoggerService } from '../Logger'

import { defaultStorageNodeSelectorConfig } from './constants'
import type {
  StorageNode,
  StorageNodeSelectorConfig,
  StorageNodeSelectorConfigInternal,
  StorageNodeSelectorService
} from './types'

const DISCOVERY_RESPONSE_TIMEOUT = 15000

export class StorageNodeSelector implements StorageNodeSelectorService {
  private readonly config: StorageNodeSelectorConfigInternal
  private readonly auth: AuthService
  private readonly logger: LoggerService
  private nodes: StorageNode[]
  private orderedNodes?: string[] // endpoints (lowercase)
  private selectedNode?: string | null
  private selectedDiscoveryNode?: string | null
  private readonly discoveryNodeSelector?: DiscoveryNodeSelectorService
  private readonly initialDiscoveryFetchPromise: Promise<void>
  private resolveInitialDiscoveryFetchPromise: () => void = () => {}

  constructor(config: StorageNodeSelectorConfig) {
    this.config = mergeConfigWithDefaults(
      config,
      defaultStorageNodeSelectorConfig
    )
    this.discoveryNodeSelector = config.discoveryNodeSelector
    this.auth = config.auth

    this.logger = this.config.logger.createPrefixedLogger(
      '[storage-node-selector]'
    )
    this.nodes = this.config.bootstrapNodes ?? []

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
    this.resolveInitialDiscoveryFetchPromise()
  }

  public async getSelectedNode() {
    if (this.selectedNode) {
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

  public getNodes(cid: string) {
    return this.orderNodes(cid)
  }

  private async select() {
    if (!this.orderedNodes) {
      this.orderedNodes = await this.orderNodes(
        (await this.auth.getAddress()).toLowerCase()
      )
    }

    if (this.orderedNodes.length === 0) {
      return null
    }

    const currentNodeIndex = this.selectedNode
      ? this.orderedNodes.indexOf(this.selectedNode)
      : -1

    let selectedNode: Maybe<string>
    let nextNodeIndex = currentNodeIndex

    while (!selectedNode) {
      nextNodeIndex = (nextNodeIndex + 1) % this.orderedNodes.length
      if (nextNodeIndex === currentNodeIndex) break
      const nextNode = this.orderedNodes[nextNodeIndex]
      if (!nextNode) continue
      if (await isNodeHealthy(nextNode)) {
        selectedNode = nextNode
      }
    }

    this.selectedNode = selectedNode
    this.logger.info('Selected content node', this.selectedNode)
    return this.selectedNode ?? null
  }

  private orderNodes(key: string) {
    const endpoints = this.nodes.map((node) => node.endpoint.toLowerCase())
    const hash = new RendezvousHash(...endpoints)
    return hash.getN(this.nodes.length, key)
  }
}
