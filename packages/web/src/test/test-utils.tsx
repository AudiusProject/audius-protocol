import { ReactElement, ReactNode } from 'react'

import { ThemeProvider } from '@audius/harmony'
import { render, RenderOptions } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { HistoryRouter as Router } from 'redux-first-history/rr6'
import { PartialDeep } from 'type-fest'

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
    const history = createMemoryHistory()
    return (
      <ThemeProvider theme='day'>
        <ReduxProvider initialStoreState={reduxState}>
          <RouterContextProvider>
            <ToastContextProvider>
              <Router history={history}>
                <CompatRouter>{children}</CompatRouter>
              </Router>
            </ToastContextProvider>
          </RouterContextProvider>
        </ReduxProvider>
      </ThemeProvider>
    )
  }

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & TestOptions

const customRender = (ui: ReactElement, options?: CustomRenderOptions) =>
  render(ui, { wrapper: TestProviders(options), ...options })

export * from '@testing-library/react'
export type { CustomRenderOptions as RenderOptions }
export { customRender as render }
