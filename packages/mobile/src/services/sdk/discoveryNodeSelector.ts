import { DiscoveryNodeSelectorService } from '@audius/common'

import { env } from '../env'
import { remoteConfigInstance } from '../remote-config/remote-config-instance'

export const discoveryNodeSelectorService = new DiscoveryNodeSelectorService({
  env,
  remoteConfigInstance
})
