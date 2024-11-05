import { makeGetStorageNodeSelector } from '@audius/common/services'

import { env } from 'services/env'

import { sdkAuthAdapter } from './auth'
import { discoveryNodeSelectorService } from './discoveryNodeSelector'

export const getStorageNodeSelector = makeGetStorageNodeSelector({
  auth: sdkAuthAdapter,
  discoveryNodeSelectorService,
  env
})
