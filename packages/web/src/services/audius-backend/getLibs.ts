import { FeatureFlags, RemoteConfigInstance } from '@audius/common'

export const getLibs = async (remoteConfig: RemoteConfigInstance) => {
  await remoteConfig.waitForRemoteConfig()
  const isProxyWormholeEnabled = remoteConfig.getFeatureEnabled(
    FeatureFlags.PROXY_WORMHOLE
  )
  return isProxyWormholeEnabled
    ? import('@audius/sdk/dist/web-libs')
    : import('@audius/sdk/dist/legacy')
}
