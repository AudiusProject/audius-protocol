import { productionConfig } from '../../config'
import { Logger } from '../Logger'

import type { DiscoveryNodeSelectorServiceConfigInternal } from './types'

/**
 * The name of the service for Discovery Node
 */
export const DISCOVERY_SERVICE_NAME = 'discovery-node'

export const defaultDiscoveryNodeSelectorConfig: DiscoveryNodeSelectorServiceConfigInternal =
  {
    initialSelectedNode: null,
    blocklist: null,
    allowlist: null,
    maxConcurrentRequests: 6,
    requestTimeout: 30000, // 30s
    unhealthyTTL: 3600000, // 1 hour
    backupsTTL: 120000, // 2 min
    healthCheckThresholds: {
      minVersion: productionConfig.minVersion,
      maxSlotDiffPlays: null,
      maxBlockDiff: 15
    },
    bootstrapServices: productionConfig.discoveryNodes,
    logger: new Logger(),
    useDiscoveryRelay: false
  }
