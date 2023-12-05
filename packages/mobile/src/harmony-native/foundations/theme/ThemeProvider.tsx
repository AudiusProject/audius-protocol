import type { ReactNode } from 'react'

import { ThemeProvider as EmotionThemeProvider } from '@emotion/react'

import type { Theme } from '../types'

import { nativeHarmonyThemes } from './theme'

type ThemeProviderProps = {
  theme: Theme
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme } = props
  return (
    <EmotionThemeProvider theme={nativeHarmonyThemes[theme]}>
      {children}
    </EmotionThemeProvider>
  )
}
