import type { AuthService, StorageNodeSelectorService } from '@audius/sdk'
import {
  StorageNodeSelector,
  developmentConfig,
  getDefaultStorageNodeSelectorConfig,
  productionConfig,
  stagingConfig
} from '@audius/sdk'

import { Maybe } from '~/utils/typeUtils'

import { Env } from '../env'

import { DiscoveryNodeSelectorService } from './discovery-node-selector'

let storageNodeSelectorPromise: Maybe<Promise<StorageNodeSelectorService>>

type StorageNodeSelectorConfig = {
  auth: AuthService
  discoveryNodeSelectorService: DiscoveryNodeSelectorService
  env: Env
}

const makeStorageNodeSelector = async (config: StorageNodeSelectorConfig) => {
  const { discoveryNodeSelectorService, auth, env } = config
  const discoveryNodeSelector = await discoveryNodeSelectorService.getInstance()
  return new StorageNodeSelector({
    ...getDefaultStorageNodeSelectorConfig(
      env.ENVIRONMENT === 'development'
        ? developmentConfig
        : env.ENVIRONMENT === 'staging'
        ? stagingConfig
        : productionConfig
    ),
    auth,
    discoveryNodeSelector
  })
}

export const makeGetStorageNodeSelector = (
  config: StorageNodeSelectorConfig
) => {
  return async function getStorageNodeSelector() {
    if (!storageNodeSelectorPromise) {
      storageNodeSelectorPromise = makeStorageNodeSelector(config)
    }
    return await storageNodeSelectorPromise
  }
}
