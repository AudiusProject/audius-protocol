import { sampleSize } from 'lodash'

import { Base } from './base'
import { timeRequests } from '../utils/network'
import { CreatorNodeSelection } from '../services/creatorNode'

import type { Nullable, ServiceWithEndpoint } from '../utils'

const CONTENT_NODE_SERVICE_NAME = 'content-node'
const DISCOVERY_NODE_SERVICE_NAME = 'discovery-node'

// Default timeout for each content node's sync and health check
const CONTENT_NODE_DEFAULT_SELECTION_TIMEOUT = 7500
// Default time at which responses are considered equal weighting.
// Content nodes that reply within 200ms of eachother are given equal footing
// in selection
const CONTENT_NODE_SELECTION_EQUIVALENCY_DELTA = 200

type AutoSelectCreatorNodesConfig = {
  // total number of nodes to fetch (2 secondaries means 3 total)
  numberOfNodes?: number
  // whether or not to include only specified nodes (default no whitelist)
  whitelist?: Nullable<Set<string>>
  // whether or not to exclude any nodes (default no blacklist)
  blacklist?: Nullable<Set<string>>
  // whether or not to perform sync check
  performSyncCheck?: boolean
  // ms applied to each request made to a content node
  timeout?: number
  equivalencyDelta?: number
  preferHigherPatchForPrimary?: boolean
  preferHigherPatchForSecondaries?: boolean
  log?: boolean
}

/**
 * API methods to interact with Audius service providers.
 * Types of services include:
 *    - Content Node (host creator content)
 *    - Discovery Node (index and make content queryable)
 * Retrieving lists of available services, etc. are found here.
 */
export class ServiceProvider extends Base {
  /* ------- Content Node  ------- */

  async listCreatorNodes() {
    return await this.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(
      CONTENT_NODE_SERVICE_NAME
    )
  }

  /**
   * Fetches healthy Content Nodes filtered down to a given whitelist and blacklist
   */
  async getSelectableCreatorNodes(
    whitelist: Nullable<Set<string>> = null, // whether or not to include only specified nodes (default no whiltelist)
    blacklist: Nullable<Set<string>> = null, // whether or not to exclude any nodes (default no blacklist)
    timeout = CONTENT_NODE_DEFAULT_SELECTION_TIMEOUT
  ) {
    let creatorNodes = await this.listCreatorNodes()

    // Filter whitelist
    if (whitelist) {
      creatorNodes = creatorNodes.filter((node) => whitelist.has(node.endpoint))
    }
    // Filter blacklist
    if (blacklist) {
      creatorNodes = creatorNodes.filter(
        (node) => !blacklist.has(node.endpoint)
      )
    }

    // Time requests and get version info
    const timings = await timeRequests({
      requests: creatorNodes.map((node) => ({
        id: node.endpoint,
        url: `${node.endpoint}/health_check/verbose`
      })),
      sortByVersion: true,
      timeout,
      headers: {
        'User-Agent':
          'Axios - @audius/sdk - ServiceProvider.ts#getSelectableCreatorNodes'
      }
    })

    const services: { [id: string]: any } = {}
    timings.forEach((timing) => {
      if (timing.response && timing.request.id)
        services[timing.request.id] = timing.response.data.data
    })

    return services
  }

  /**
   * Fetches healthy Content Nodes and autoselects a primary
   * and two secondaries.
   */
  async autoSelectCreatorNodes({
    numberOfNodes = 3,
    whitelist = null,
    blacklist = null,
    performSyncCheck = true,
    timeout = CONTENT_NODE_DEFAULT_SELECTION_TIMEOUT,
    equivalencyDelta = CONTENT_NODE_SELECTION_EQUIVALENCY_DELTA,
    preferHigherPatchForPrimary = true,
    preferHigherPatchForSecondaries = true,
    log = true
  }: AutoSelectCreatorNodesConfig) {
    const creatorNodeSelection = new CreatorNodeSelection({
      creatorNode: this.creatorNode,
      ethContracts: this.ethContracts,
      logger: this.logger,
      numberOfNodes,
      whitelist,
      blacklist,
      timeout,
      equivalencyDelta,
      preferHigherPatchForPrimary,
      preferHigherPatchForSecondaries
    })

    const { primary, secondaries, services } =
      await creatorNodeSelection.select(performSyncCheck, log)
    return { primary, secondaries, services }
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
