import type { Transport } from 'viem'
import { useMemo } from 'react'
import { http, createConfig, fallback, webSocket } from 'wagmi'
import { mainnet, goerli } from 'wagmi/chains'
import { useEnvVars } from '../providers/EnvVarsProvider.tsx'
// import { metaMask } from 'wagmi/connectors'

export const useWagmiConfig = () => {
  const { ethProviderUrl } = useEnvVars()

  return useMemo(() => {
    // audius-docker-compose configs only allow for one RPC env var, which could be a single endpoint or a comma-separated list of endpoint
    const providerEndpoints = ethProviderUrl.includes(',')
      ? ethProviderUrl.split(',')
      : [ethProviderUrl]
    const rpcProviders: Transport[] = providerEndpoints.map((url) =>
      url.startsWith('ws') ? webSocket(url) : http(url)
    )

    // Allows for fallback to other RPC endpoints if the first one fails
    const transports = fallback([
      ...rpcProviders,
      http('http://audius-protocol-eth-ganache-1'),
      http() // Public fallback provider (rate-limited)
    ])

    const wagmiConfig = createConfig({
      chains: [mainnet, goerli],
      // connectors: [metaMask()],
      transports: {
        [mainnet.id]: transports,
        [goerli.id]: transports
      }
    })

    return wagmiConfig
  }, [ethProviderUrl])
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof useWagmiConfig>
  }
}
