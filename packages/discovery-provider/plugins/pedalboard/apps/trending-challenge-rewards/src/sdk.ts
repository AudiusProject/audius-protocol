import { Configuration, DiscoveryNodeSelector, SolanaRelay, sdk } from '@audius/sdk' 


const makeDiscoveryNodeSelector = (allowlist?: string[]) => {
  return new DiscoveryNodeSelector({
    allowlist: allowlist ? new Set(allowlist) : undefined,
  })
}

const solanaRelay = new SolanaRelay(
  new Configuration({
    basePath: '/solana',
    headers: {
      'Content-Type': 'application/json'
    },
    middleware: [
      {
        pre: async (context) => {
          const endpoint = 'https://discoveryprovider.audius.co'
          const url = `${endpoint}${context.url}`
          return { url, init: context.init }
        }
      }
    ]
  })
)

export const audiusSdk = (
  { environment, discoveryNodeAllowlist }:
  { environment: 'development' | 'staging' | 'production', discoveryNodeAllowlist?: string[] }
) => {
  return sdk({
    appName: 'trending-challenge-rewards',
    environment,
    services: {
      discoveryNodeSelector: makeDiscoveryNodeSelector(discoveryNodeAllowlist),
      solanaRelay,
    },
  })
}
