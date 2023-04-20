import { DiscoveryNodeSelectorInstance } from '@audius/common'

import { localStorage } from 'services/local-storage'

import { env } from './env'
import { remoteConfigInstance } from './remote-config/remote-config-instance'

export const discoveryNodeSelectorInstance = new DiscoveryNodeSelectorInstance({
  env,
  remoteConfigInstance,
  discoveryNodeOverrideEndpoint: localStorage.getCachedDiscoveryProvider()
})
