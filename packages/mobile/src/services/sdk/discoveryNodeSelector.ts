import { DiscoveryNodeSelectorService } from '@audius/common'

import { env } from 'app/env'
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'

export const discoveryNodeSelectorService = new DiscoveryNodeSelectorService({
  env,
  remoteConfigInstance
})
