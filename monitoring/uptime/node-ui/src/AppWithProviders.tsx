import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { WagmiProvider } from 'wagmi'
import { AudiusLibsProvider } from './providers/AudiusLibsProvider.tsx'
import App from './App.tsx'
import { useWagmiConfig } from './hooks/useWagmiConfig.tsx'

const AppWithProviders = () => {
  const wagmiConfig = useWagmiConfig()

  const queryClient = new QueryClient()

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AudiusLibsProvider>
          <App />
        </AudiusLibsProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default AppWithProviders
