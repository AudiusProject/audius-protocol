import { ReactElement, ReactNode } from 'react'

import {
  AudiusQueryContext,
  AudiusQueryContextType
} from '@audius/common/audius-query'
import { ThemeProvider } from '@audius/harmony'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { PartialDeep } from 'type-fest'

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

type TestOptions = {
  reduxState?: PartialDeep<AppState>
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
  const { store } = configureStore(history, isMobile, initialStoreState)

  return <Provider store={store}>{children}</Provider>
}

type TestProvidersProps = {
  children: ReactNode
}

const audiusQueryContext = {} as unknown as AudiusQueryContextType

const TestProviders =
  (options?: TestOptions) => (props: TestProvidersProps) => {
    const { children } = props
    const { reduxState } = options ?? {}
    return (
      <HistoryContextProvider>
        <QueryClientProvider client={queryClient}>
          <AudiusQueryContext.Provider value={audiusQueryContext}>
            <ThemeProvider theme='day'>
              <ReduxProvider initialStoreState={reduxState}>
                <RouterContextProvider>
                  <ToastContextProvider>
                    <HistoryContext.Consumer>
                      {({ history }) => (
                        <Router history={history}>
                          <CompatRouter>{children}</CompatRouter>
                        </Router>
                      )}
                    </HistoryContext.Consumer>
                  </ToastContextProvider>
                </RouterContextProvider>
              </ReduxProvider>
            </ThemeProvider>
          </AudiusQueryContext.Provider>
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
