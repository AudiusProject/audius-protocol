import { makeGetStorageNodeSelector } from '@audius/common/schemas'

import { env } from 'services/env'

import { auth } from './auth'
import { discoveryNodeSelectorService } from './discoveryNodeSelector'

export const getStorageNodeSelector = makeGetStorageNodeSelector({
  auth,
  discoveryNodeSelectorService,
  env
})
