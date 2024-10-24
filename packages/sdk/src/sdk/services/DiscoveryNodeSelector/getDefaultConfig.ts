import type { SdkServicesConfig } from '../../config/types'
import { Logger } from '../Logger'

import type { DiscoveryNodeSelectorServiceConfigInternal } from './types'

export const getDefaultDiscoveryNodeSelectorConfig = (
  config: SdkServicesConfig
): DiscoveryNodeSelectorServiceConfigInternal => ({
  initialSelectedNode: null,
  blocklist: null,
  allowlist: null,
  maxConcurrentRequests: 6,
  requestTimeout: 30000, // 30s
  unhealthyTTL: 3600000, // 1 hour
  backupsTTL: 120000, // 2 min
  healthCheckThresholds: {
    minVersion: config.network.minVersion,
    maxSlotDiffPlays: null,
    maxBlockDiff: 15
  },
  bootstrapServices: config.network.discoveryNodes,
  logger: new Logger()
})
