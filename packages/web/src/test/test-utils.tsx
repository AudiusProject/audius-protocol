import { ReactElement, ReactNode } from 'react'

import { ThemeProvider } from '@audius/harmony'
import { render, RenderOptions } from '@testing-library/react'
import { HistoryRouter as Router } from 'redux-first-history/rr6'
import { PartialDeep } from 'type-fest'

import { HistoryContext, HistoryContextProvider } from 'app/HistoryProvider'
import { ReduxProvider } from 'app/ReduxProvider'
import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { AppState } from 'store/types'

type TestOptions = {
  reduxState?: PartialDeep<AppState>
}

type TestProvidersProps = {
  children: ReactNode
}

const TestProviders =
  (options?: TestOptions) => (props: TestProvidersProps) => {
    const { children } = props
    const { reduxState } = options ?? {}
    return (
      <HistoryContextProvider>
        <ThemeProvider theme='day'>
          <ReduxProvider initialStoreState={reduxState}>
            <RouterContextProvider>
              <ToastContextProvider>
                <HistoryContext.Consumer>
                  {({ history }) => (
                    <Router history={history}>{children}</Router>
                  )}
                </HistoryContext.Consumer>
              </ToastContextProvider>
            </RouterContextProvider>
          </ReduxProvider>
        </ThemeProvider>
      </HistoryContextProvider>
    )
  }

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & TestOptions

const customRender = (ui: ReactElement, options?: CustomRenderOptions) =>
  render(ui, { wrapper: TestProviders(options), ...options })

export * from '@testing-library/react'
export type { CustomRenderOptions as RenderOptions }
export { customRender as render }
