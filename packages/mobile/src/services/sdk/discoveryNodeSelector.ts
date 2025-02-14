import { DiscoveryNodeSelectorService } from '@audius/common/services'

import { env } from 'app/services/env'
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'

export const discoveryNodeSelectorService = new DiscoveryNodeSelectorService({
  env,
  remoteConfigInstance
})
