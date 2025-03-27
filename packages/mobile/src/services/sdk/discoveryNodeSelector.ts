import { DiscoveryNodeSelectorService } from '@audius/common/services'

import { env } from 'app/services/env'
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'

const getSelectorService = () => {
  if (env.API_SERVER_URL) {
    return new DiscoveryNodeSelectorService({
      env,
      remoteConfigInstance,
      initialSelectedNode: env.API_SERVER_URL,
      skipReselect: true
    })
  }
  return new DiscoveryNodeSelectorService({
    env,
    remoteConfigInstance
  })
}

export const discoveryNodeSelectorService = getSelectorService()
