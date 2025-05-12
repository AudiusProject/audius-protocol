import { ReactElement, ReactNode } from 'react'

import { QueryContext, QueryContextType } from '@audius/common/api'
import { AppContext } from '@audius/common/context'
import { FeatureFlags } from '@audius/common/services'
import { ThemeProvider } from '@audius/harmony'
import { sdk } from '@audius/sdk'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { PartialDeep } from 'type-fest'
import { vi } from 'vitest'

import {
  HistoryContext,
  HistoryContextProvider,
  useHistoryContext
} from 'app/HistoryProvider'
import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { queryClient } from 'services/query-client'
import { configureStore } from 'store/configureStore'
import { AppState } from 'store/types'

import { createMockAppContext } from './mocks/app-context'
// import { audiusSdk } from 'services/audius-sdk'

type TestOptions = {
  reduxState?: PartialDeep<AppState>
  featureFlags?: Partial<Record<FeatureFlags, boolean>>
}

type ReduxProviderProps = {
  children: ReactNode
  initialStoreState?: PartialDeep<AppState>
}

export const ReduxProvider = ({
  children,
  initialStoreState
}: ReduxProviderProps) => {
  const { history } = useHistoryContext()
  const isMobile = useIsMobile()
  const { store } = configureStore({
    history,
    isMobile,
    initialStoreState,
    isTest: true
  })

  return <Provider store={store}>{children}</Provider>
}

type TestProvidersProps = {
  children: ReactNode
}

const audiusSdk = () => {
  return sdk({
    appName: 'test',
    environment: 'development',
    services: {
      claimableTokensClient: vi.fn(),
      rewardManagerClient: vi.fn(),
      paymentRouterClient: vi.fn(),
      storageNodeSelector: vi.fn(),
      audiusWalletClient: {
        signMessage: vi.fn(),
        getAddresses: vi
          .fn()
          .mockResolvedValue(['0x0000000000000000000000000000000000000000'])
      }
    }
  })
}

const TestProviders =
  (options?: TestOptions) => (props: TestProvidersProps) => {
    const { children } = props
    const { reduxState, featureFlags } = options ?? {}
    const mockAppContext = createMockAppContext(featureFlags)
    const queryContext = {
      audiusSdk
    } as unknown as QueryContextType

    return (
      <HistoryContextProvider>
        <QueryClientProvider client={queryClient}>
          <QueryContext.Provider value={queryContext}>
            <ThemeProvider theme='day'>
              <ReduxProvider initialStoreState={reduxState}>
                <RouterContextProvider>
                  <AppContext.Provider value={mockAppContext}>
                    <ToastContextProvider>
                      <HistoryContext.Consumer>
                        {({ history }) => (
                          <Router history={history}>
                            <CompatRouter>{children}</CompatRouter>
                          </Router>
                        )}
                      </HistoryContext.Consumer>
                    </ToastContextProvider>
                  </AppContext.Provider>
                </RouterContextProvider>
              </ReduxProvider>
            </ThemeProvider>
          </QueryContext.Provider>
        </QueryClientProvider>
      </HistoryContextProvider>
    )
  }

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & TestOptions

const customRender = (ui: ReactElement, options?: CustomRenderOptions) =>
  render(ui, { wrapper: TestProviders(options), ...options })

export * from '@testing-library/react'
export type { CustomRenderOptions as RenderOptions }
export { customRender as render }
