import {
  developmentConfig,
  productionConfig,
  stagingConfig
} from '../../config'
import { Env } from '../../types/Env'
import { Logger } from '../Logger'

import type { DiscoveryNodeSelectorServiceConfigInternal } from './types'

/**
 * The name of the service for Discovery Node
 */
export const DISCOVERY_SERVICE_NAME = 'discovery-node'

export const defaultDiscoveryNodeSelectorConfig: Record<
  Env,
  DiscoveryNodeSelectorServiceConfigInternal
> = {
  production: {
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
    logger: new Logger()
  },
  staging: {
    initialSelectedNode: null,
    blocklist: null,
    allowlist: null,
    maxConcurrentRequests: 6,
    requestTimeout: 30000, // 30s
    unhealthyTTL: 3600000, // 1 hour
    backupsTTL: 120000, // 2 min
    healthCheckThresholds: {
      minVersion: stagingConfig.minVersion,
      maxSlotDiffPlays: null,
      maxBlockDiff: 15
    },
    bootstrapServices: stagingConfig.discoveryNodes,
    logger: new Logger({ logLevel: 'debug' })
  },
  development: {
    initialSelectedNode: null,
    blocklist: null,
    allowlist: null,
    maxConcurrentRequests: 6,
    requestTimeout: 30000, // 30s
    unhealthyTTL: 3600000, // 1 hour
    backupsTTL: 120000, // 2 min
    healthCheckThresholds: {
      minVersion: developmentConfig.minVersion,
      maxSlotDiffPlays: null,
      maxBlockDiff: 15
    },
    bootstrapServices: developmentConfig.discoveryNodes,
    logger: new Logger({ logLevel: 'debug' })
  }
}
