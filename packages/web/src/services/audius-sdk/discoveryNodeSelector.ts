import { DiscoveryNodeSelectorService } from '@audius/common/schemas'

import { env } from '../env'
import { remoteConfigInstance } from '../remote-config/remote-config-instance'

const DISCOVERY_PROVIDER_TIMESTAMP = '@audius/libs:discovery-node-timestamp'
const CACHE_TTL = 24 * 60 * 1000 // 24 hours

type CachedDiscoveryNodeTimestamp =
  | {
      endpoint?: string
      timestamp?: number
    }
  | null
  | undefined

const getCachedDiscoveryNode = () => {
  const cached =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(DISCOVERY_PROVIDER_TIMESTAMP)
      : null
  if (cached) {
    try {
      const cachedDiscoveryNodeTimestamp = JSON.parse(
        cached
      ) as CachedDiscoveryNodeTimestamp
      if (
        cachedDiscoveryNodeTimestamp?.timestamp &&
        cachedDiscoveryNodeTimestamp.timestamp >
          new Date().getTime() - CACHE_TTL
      ) {
        const cachedDiscoveryNode =
          cachedDiscoveryNodeTimestamp.endpoint ?? undefined
        console.debug(
          '[discovery-node-selector-service] Using cached discovery node',
          cachedDiscoveryNode
        )
        return cachedDiscoveryNode
      } else {
        console.debug(
          '[discovery-node-selector-service] Cached discovery node expired',
          cachedDiscoveryNodeTimestamp
        )
      }
    } catch (e) {
      console.error(
        "[discovery-node-selector-service] Couldn't parse cached discovery node",
        e
      )
    }
  }
}

const updateCachedDiscoveryNode = (endpoint: string) => {
  const newTimestamp: CachedDiscoveryNodeTimestamp = {
    endpoint,
    timestamp: new Date().getTime()
  }
  console.debug(
    '[discovery-node-selector-service] Updating cached discovery provider',
    newTimestamp
  )
  localStorage.setItem(
    DISCOVERY_PROVIDER_TIMESTAMP,
    JSON.stringify(newTimestamp)
  )
}

export const discoveryNodeSelectorService = new DiscoveryNodeSelectorService({
  env,
  remoteConfigInstance,
  initialSelectedNode: getCachedDiscoveryNode(),
  onChange: updateCachedDiscoveryNode
})
