import { useEffect, type ReactNode } from 'react'

import { ThemeProvider as EmotionThemeProvider } from '@emotion/react'

import { themes } from './theme'
import { themesV2 } from './themeV2'
import type { Theme } from './types'

type ThemeProviderProps = {
  theme: Theme
  version: 'v1' | 'v2'
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme, version } = props

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(
        'data-theme',
        version === 'v2' ? `${theme}-v2` : theme
      )
    }
  }, [theme, version])

  return (
    <EmotionThemeProvider
      theme={version === 'v2' ? themesV2[theme] : themes[theme]}
    >
      {children}
    </EmotionThemeProvider>
  )
}
