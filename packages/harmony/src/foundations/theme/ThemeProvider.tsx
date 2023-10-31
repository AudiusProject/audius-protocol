import type { ReactNode } from 'react'

import { ThemeProvider as EmationThemeProvider } from '@emotion/react'

import { dayTheme, darkTheme, matrixTheme } from './theme'
import type { Theme } from './types'

const themes = {
  day: dayTheme,
  dark: darkTheme,
  matrix: matrixTheme
}

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
