import { ReactNode } from 'react'

import { Theme, SystemAppearance } from '@audius/common/models'
import { themeSelectors } from '@audius/common/store'
import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'

import { AppState } from 'store/types'
import { useSelector } from 'utils/reducer'
import {
  doesPreferDarkMode,
  getTheme as getThemeFromLocalStorage
} from 'utils/theme/theme'

const { getTheme, getSystemAppearance } = themeSelectors

const selectHarmonyTheme = (state: AppState) => {
  let theme = getTheme(state)
  let systemAppearance = getSystemAppearance(state)

  if (theme === null) {
    theme = getThemeFromLocalStorage()
  }

  if (systemAppearance === null) {
    systemAppearance = doesPreferDarkMode()
      ? SystemAppearance.DARK
      : SystemAppearance.LIGHT
  }

  switch (theme) {
    case Theme.DEFAULT:
      return 'day'
    case Theme.DARK:
      return 'dark'
    case Theme.MATRIX:
      return 'matrix'
    case Theme.AUTO:
      switch (systemAppearance) {
        case SystemAppearance.DARK:
          return 'dark'
        case SystemAppearance.LIGHT:
          return 'day'
        default:
          return 'day'
      }
    default:
      return 'day'
  }
}

type ThemeProviderProps = {
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children } = props
  const harmonyTheme = useSelector(selectHarmonyTheme)

  return (
    <HarmonyThemeProvider theme={harmonyTheme}>{children}</HarmonyThemeProvider>
  )
}
