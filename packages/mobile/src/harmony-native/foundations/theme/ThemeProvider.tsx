import type { ReactNode } from 'react'

import type { Theme } from '@audius/harmony'
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react'

import { theme } from './theme'

type ThemeProviderProps = {
  themeName: Theme
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, themeName } = props
  return (
    <EmotionThemeProvider theme={theme[themeName]}>
      {children}
    </EmotionThemeProvider>
  )
}
