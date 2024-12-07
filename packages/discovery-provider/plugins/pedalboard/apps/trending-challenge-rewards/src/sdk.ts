import { Configuration, DiscoveryNodeSelector, SolanaRelay, sdk } from '@audius/sdk' 

const discoveryNodeSelector = new DiscoveryNodeSelector({
  allowlist: new Set([
    'https://discoveryprovider.audius.co',
    'https://dn2.monophonic.digital',
    'https://audius-metadata-1.figment.io'
  ]),
})

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

export const audiusSdk = ({ environment }: { environment: 'development' | 'staging' | 'production' }) => {
  return sdk({
    appName: 'trending-challenge-rewards',
    environment,
    services: {
      discoveryNodeSelector,
      solanaRelay,
    },
  })
}
