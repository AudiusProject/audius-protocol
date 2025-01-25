import { ReactNode, useState } from 'react'

import { mainnet, solana, type AppKitNetwork } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as ReduxProvider } from 'react-redux'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { LastLocationProvider } from 'react-router-last-location'
import { WagmiProvider } from 'wagmi'

import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/mobile/NavContext'
import { ScrollProvider } from 'components/scroll-provider/ScrollProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { MainContentContextProvider } from 'pages/MainContentContext'
import { audiusChain, wagmiConfig } from 'services/audius-sdk/wagmi'
import { queryClient } from 'services/query-client'
import { configureStore } from 'store/configureStore'
import { getSystemAppearance, getTheme } from 'utils/theme/theme'

import { AppContextProvider } from './AppContextProvider'
import { AudiusQueryProvider } from './AudiusQueryProvider'
import { useHistoryContext } from './HistoryProvider'
import { ThemeProvider } from './ThemeProvider'

type AppProvidersProps = {
  children: ReactNode
}

// 1. Get projectId from https://cloud.reown.com
const projectId = '24a90db08b835b7539f7f7f06d4d2374'

// 2. Create a metadata object - optional
const metadata = {
  name: 'Audius Stage',
  description: 'AppKit Example',
  url: 'https://reown.com/appkit', // origin must match your domain & subdomain
  icons: ['https://assets.reown.com/reown-profile-pic.png']
}

// 3. Set the networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  audiusChain,
  solana
]

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

const solanaAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
})

// 5. Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  networks,
  projectId,
  metadata,
  themeVariables: {
    '--w3m-z-index': 100000000000 // above modals
  }
})

export const AppProviders = ({ children }: AppProvidersProps) => {
  const { history } = useHistoryContext()
  const isMobile = useIsMobile()

  const [{ store, storeHistory }] = useState(() => {
    const initialStoreState = {
      ui: {
        theme: {
          theme: getTheme(),
          systemAppearance: getSystemAppearance()
        }
      }
    }

    const { store, history: storeHistory } = configureStore(
      history,
      isMobile,
      initialStoreState
    )
    // Mount store to window for easy access
    if (typeof window !== 'undefined' && !window.store) {
      window.store = store
    }
    return { store, storeHistory }
  })

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider store={store}>
          <Router history={storeHistory}>
            <CompatRouter>
              <LastLocationProvider>
                <RouterContextProvider>
                  <HeaderContextProvider>
                    <NavProvider>
                      <ScrollProvider>
                        <ThemeProvider>
                          <ToastContextProvider>
                            <AppContextProvider>
                              <AudiusQueryProvider>
                                <MainContentContextProvider>
                                  {children}
                                </MainContentContextProvider>
                              </AudiusQueryProvider>
                            </AppContextProvider>
                          </ToastContextProvider>
                        </ThemeProvider>
                      </ScrollProvider>
                    </NavProvider>
                  </HeaderContextProvider>
                </RouterContextProvider>
              </LastLocationProvider>
            </CompatRouter>
          </Router>
        </ReduxProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
export { wagmiConfig }
