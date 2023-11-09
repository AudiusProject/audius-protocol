import { sampleSize } from 'lodash'

import type { ServiceWithEndpoint } from '../utils'
import { getNStorageNodes } from '../utils/getNStorageNodes'

import { Base, BaseConstructorArgs } from './base'

const CONTENT_NODE_SERVICE_NAME = 'content-node'
const DISCOVERY_NODE_SERVICE_NAME = 'discovery-node'

/**
 * API methods to interact with Audius service providers.
 * Types of services include:
 *    - Content Node (host creator content)
 *    - Discovery Node (index and make content queryable)
 * Retrieving lists of available services, etc. are found here.
 */
export class ServiceProvider extends Base {
  cachedStorageNodes: Array<{
    owner: any
    endpoint: string
    spID: number
    type: string
    blockNumber: number
    delegateOwnerWallet: string
  }>

  constructor(...services: BaseConstructorArgs) {
    super(...services)
    this.cachedStorageNodes = []
  }

  /* ------- Content Node  ------- */

  async listCreatorNodes() {
    return await this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(
      CONTENT_NODE_SERVICE_NAME
    )
  }

  /**
   * Selects numNodes storage nodes from the list of registered storage nodes on chain, optionally ordering them (descending) by rendezvous score.
   * TODO: This might want to handle blocklist/allowlist, latency checks, health checks, etc... but for now it just uses all nodes.
   *       CN selection without health checks might be a separate part of SDK anyway.
   */
  async autoSelectStorageV2Nodes(
    numNodes = 0,
    userWallet = '',
    logger = console
  ): Promise<string[]> {
    if (!this.cachedStorageNodes.length) {
      this.cachedStorageNodes = await this.listCreatorNodes()
    }
    return await getNStorageNodes(
      this.cachedStorageNodes,
      numNodes,
      userWallet,
      logger
    )
  }

  /* ------- Discovery Node ------ */

  async listDiscoveryProviders() {
    return await this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(
      DISCOVERY_NODE_SERVICE_NAME
    )
  }

  /**
   * Returns a list of discovery nodes of size `quorumSize` that belong to
   * unique service operators.
   * Throws if unable to find a large enough list.
   */
  async getUniquelyOwnedDiscoveryNodes({
    quorumSize,
    discoveryNodes = [],
    filter = async (_) => true,
    useWhitelist = true
  }: {
    quorumSize: number
    discoveryNodes?: ServiceWithEndpoint[]
    filter?: (node: ServiceWithEndpoint) => Promise<boolean>
    useWhitelist?: boolean
  }) {
    if (!discoveryNodes || discoveryNodes.length === 0) {
      // Whitelist logic: if useWhitelist is false, pass in null to override internal whitelist logic; if true, pass in undefined
      // so service selector uses internal whitelist
      discoveryNodes = (await this.discoveryProvider.serviceSelector.findAll({
        verbose: true,
        whitelist: useWhitelist ? undefined : null
      })) as ServiceWithEndpoint[]
    }

    discoveryNodes.filter(filter)

    // Group nodes by owner
    const grouped = discoveryNodes.reduce<{
      [owner: string]: ServiceWithEndpoint[]
    }>((acc, curr) => {
      if (curr.owner in acc) {
        acc[curr.owner]?.push(curr)
      } else {
        acc[curr.owner] = [curr]
      }
      return acc
    }, {})

    if (Object.keys(grouped).length < quorumSize) {
      throw new Error('Not enough unique owners to choose from')
    }

    // Select quorumSize owners from the groups
    const owners = sampleSize(Object.keys(grouped), quorumSize)

    // Select 1 node from each owner selected
    return owners.map(
      (owner) =>
        (sampleSize(grouped[owner], 1)[0] as ServiceWithEndpoint).endpoint
    )
  }
}
