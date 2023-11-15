import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { mainnet, goerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { useEnvVars } from './providers/EnvVarsProvider.tsx'
import { AudiusLibsProvider } from './providers/AudiusLibsProvider.tsx'
import App from './App.tsx'

const AppWithProviders = () => {
  const { ethProviderUrl } = useEnvVars()

  const { chains, publicClient } = configureChains(
    [mainnet, goerli],
    [
      jsonRpcProvider({
        rpc: () => {
          return {
            http: ethProviderUrl.includes(',')
              ? ethProviderUrl.split(',')[0] // TODO: Ideally we map these to allow more fallback RPC providers
              : ethProviderUrl
          }
        }
      }),
      publicProvider()
    ]
  )

  const { connectors } = getDefaultWallets({
    appName: 'Audius Node',
    projectId: '0416e7e9c027fb75dc5a365384683fdb',
    chains
  })

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient
  })

  const queryClient = new QueryClient()

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <AudiusLibsProvider>
          <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AudiusLibsProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default AppWithProviders
