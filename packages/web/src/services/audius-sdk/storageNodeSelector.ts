import { makeGetStorageNodeSelector } from '@audius/common/services'

import { env } from 'services/env'

import { audiusWalletClient } from './auth'
import { discoveryNodeSelectorService } from './discoveryNodeSelector'

export const getStorageNodeSelector = makeGetStorageNodeSelector({
  audiusWalletClient,
  discoveryNodeSelectorService,
  env
})
