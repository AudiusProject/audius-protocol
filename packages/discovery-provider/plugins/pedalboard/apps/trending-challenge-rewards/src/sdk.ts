import {
  AntiAbuseOracleSelector,
  Configuration,
  DiscoveryNodeSelector,
  SolanaRelay,
  sdk
} from '@audius/sdk'

const makeDiscoveryNodeSelector = (allowlist?: string[]) =>
  new DiscoveryNodeSelector({
    allowlist: allowlist ? new Set(allowlist) : undefined
  })

const makeAAOSelector = () =>
  new AntiAbuseOracleSelector({
    endpoints: ['https://discoveryprovider.audius.co'],
    registeredAddresses: ['0x9811BA3eAB1F2Cd9A2dFeDB19e8c2a69729DC8b6']
  })

const makeSolanaRelay = (relayNode: string) =>
  new SolanaRelay(
    new Configuration({
      basePath: '/solana',
      headers: {
        'Content-Type': 'application/json'
      },
      middleware: [
        {
          pre: async (context) => {
            const endpoint = relayNode
            const url = `${endpoint}${context.url}`
            return { url, init: context.init }
          }
        }
      ]
    })
  )

export const audiusSdk = ({
  environment,
  discoveryNodeAllowlist,
  solanaRelayNode
}: {
  environment: 'development' | 'staging' | 'production'
  discoveryNodeAllowlist?: string[]
  solanaRelayNode: string
}) => {
  return sdk({
    appName: 'trending-challenge-rewards',
    environment,
    services: {
      discoveryNodeSelector: makeDiscoveryNodeSelector(discoveryNodeAllowlist),
      solanaRelay: makeSolanaRelay(solanaRelayNode),
      antiAbuseOracleSelector: makeAAOSelector()
    }
  })
}
