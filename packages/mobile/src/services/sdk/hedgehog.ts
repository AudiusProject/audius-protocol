import { createHedgehog } from '@audius/common/services'

import { createPrivateKey } from '../createPrivateKey'
import { localStorage } from '../local-storage'

import { identityServiceInstance } from './identity'

export const hedgehogInstance = createHedgehog({
  localStorage,
  identityService: identityServiceInstance,
  useLocalStorage: true,
  createKey: createPrivateKey
})
