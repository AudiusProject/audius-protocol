import { makeGetStorageNodeSelector } from '@audius/common'

import { env } from '../env'

import { auth } from './auth'
import { discoveryNodeSelectorService } from './discoveryNodeSelector'

export const getStorageNodeSelector = makeGetStorageNodeSelector({
  auth,
  discoveryNodeSelectorService,
  env
})
