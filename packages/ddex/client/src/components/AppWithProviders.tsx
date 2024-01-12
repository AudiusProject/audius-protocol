import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Web3 from 'web3'
import { httpBatchLink } from '@trpc/client'
import { trpc } from 'utils/trpc'

import { AudiusLibsProvider } from 'providers/AudiusLibsProvider'
import { AudiusSdkProvider } from 'providers/AudiusSdkProvider'
import { RemoteConfigProvider } from 'providers/RemoteConfigProvider'
import { ThemeProvider } from 'providers/ThemeProvider'

import App from './App'

declare global {
  interface Window {
    Web3: any
  }
}

const AppWithProviders = () => {
  window.Web3 = Web3

  const queryClient = new QueryClient()
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: '/trpc',
        async headers() {
          return {
            // TODO: probably pass something from sdk oauth
            // authorization: getAuthCookie(),
          }
        },
      }),
    ],
  })

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <RemoteConfigProvider>
        <AudiusLibsProvider>
          <AudiusSdkProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AudiusSdkProvider>
        </AudiusLibsProvider>
      </RemoteConfigProvider>
    </QueryClientProvider>
    </trpc.Provider>
  )
}

export default AppWithProviders

