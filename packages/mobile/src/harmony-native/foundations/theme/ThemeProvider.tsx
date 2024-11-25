import type { ReactNode } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import type { Theme } from '@audius/harmony/src/foundations/theme/types'
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react'

import { theme } from './theme'
import { themeV2 } from './themeV2'

type ThemeProviderProps = {
  themeName: Theme
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children, themeName } = props
  const { isEnabled: isThemeV2Enabled } = useFeatureFlag(FeatureFlags.THEME_V2)

  return (
    <EmotionThemeProvider
      theme={isThemeV2Enabled ? themeV2[themeName] : theme[themeName]}
    >
      {children}
    </EmotionThemeProvider>
  )
}
