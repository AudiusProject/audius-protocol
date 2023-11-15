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
    autoConnect: false,
    connectors,
    publicClient
  })

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <AudiusLibsProvider>
          <App />
        </AudiusLibsProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default AppWithProviders
