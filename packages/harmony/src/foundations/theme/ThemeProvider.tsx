import type { ReactNode } from 'react'

import { ThemeProvider as EmationThemeProvider } from '@emotion/react'

import { themes } from './theme'
import type { Theme } from './types'

type ThemeProviderProps = {
  theme: Theme
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme } = props

  return (
    <EmationThemeProvider theme={themes[theme]}>
      {children}
    </EmationThemeProvider>
  )
}
