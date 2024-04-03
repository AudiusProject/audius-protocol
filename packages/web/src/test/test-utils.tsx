import { ReactElement, ReactNode } from 'react'

import { ThemeProvider } from '@audius/harmony'
import { render, RenderOptions } from '@testing-library/react'

type TestProvidersProps = {
  children: ReactNode
}

const TestProviders = (props: TestProvidersProps) => {
  const { children } = props
  return <ThemeProvider theme='day'>{children}</ThemeProvider>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
