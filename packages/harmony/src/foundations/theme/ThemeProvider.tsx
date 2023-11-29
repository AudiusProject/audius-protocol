import type { ReactNode } from 'react'

import createCache from '@emotion/cache'
import {
  CacheProvider,
  ThemeProvider as EmotionThemeProvider
} from '@emotion/react'

import { themes } from './theme'
import type { Theme } from './types'

const harmonyCache = createCache({
  key: 'harmony',
  prepend: true
})

type ThemeProviderProps = {
  theme: Theme
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, theme } = props

  return (
    <CacheProvider value={harmonyCache}>
      <EmotionThemeProvider theme={themes[theme]}>
        {children}
      </EmotionThemeProvider>
    </CacheProvider>
  )
}
