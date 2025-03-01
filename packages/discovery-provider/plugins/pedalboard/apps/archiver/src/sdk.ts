import { AudiusSdk, DiscoveryNodeSelector, sdk } from '@audius/sdk'
import { readConfig } from './config'

// TODO: This doesn't seem to work correctly on staging with an allowlist
// due to SDK using the production config as a default for merging
// const makeDiscoveryNodeSelector = (allowlist?: string[]) =>
//   new DiscoveryNodeSelector({
//     allowlist: allowlist ? new Set(allowlist) : undefined
//   })

let audiusSdk: AudiusSdk | undefined = undefined

export const getAudiusSdk = () => {
  if (audiusSdk === undefined) {
    const config = readConfig()
    audiusSdk = sdk({
      appName: 'audius-client',
      environment: config.environment
      //   services: {
      //     discoveryNodeSelector: makeDiscoveryNodeSelector(
      //       config.discoveryNodeAllowlist
      //     )
      //   }
    })
  }
  return audiusSdk
}
