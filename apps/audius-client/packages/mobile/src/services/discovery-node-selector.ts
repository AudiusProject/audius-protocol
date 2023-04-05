import { DiscoveryNodeSelectorInstance } from '@audius/common'

import { env } from './env'
import { remoteConfigInstance } from './remote-config/remote-config-instance'

export const discoveryNodeSelectorInstance = new DiscoveryNodeSelectorInstance({
  env,
  remoteConfigInstance
})
