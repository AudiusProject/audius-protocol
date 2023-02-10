import type { DiscoveryNodeSelectorServiceConfigInternal } from './types'
import bootstrap from './bootstrapConfig.json'

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
    cacheTTL: 600000, //  10 min
    healthCheckThresholds: {
      minVersion: bootstrap.version,
      maxSlotDiffPlays: null,
      maxBlockDiff: 15
    },
    bootstrapServices: bootstrap.services
  }
