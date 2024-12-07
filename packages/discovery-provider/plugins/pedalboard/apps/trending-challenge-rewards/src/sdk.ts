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

export const audiusSdk = () => {
  return sdk({
    appName: 'trending-challenge-rewards',
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    environment: process.env.ENVIRONMENT as 'development' | 'staging' | 'production' | undefined ?? 'staging',
    services: {
      discoveryNodeSelector,
      solanaRelay,
    },
  })
}
