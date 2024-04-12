import { ReactElement, ReactNode } from 'react'

import { ThemeProvider } from '@audius/harmony'
import { render, RenderOptions } from '@testing-library/react'
import { createMemoryHistory, type InitialEntry } from 'history'
import { Router } from 'react-router-dom'
import {
  CompatRouter,
  MemoryRouter,
  Route,
  Routes
} from 'react-router-dom-v5-compat'
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

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & TestOptions
) => render(ui, { wrapper: TestProviders(options), ...options })

export * from '@testing-library/react'
export { customRender as render }
