import { ReactNode } from 'react'

import { Theme, SystemAppearance } from '@audius/common/models'
import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'

import { AppState } from 'store/types'
import { useSelector } from 'utils/reducer'

const getBaseState = (state: AppState) => state.ui.theme

const getTheme = (state: AppState) => {
  return getBaseState(state).theme
}

const getSystemAppearance = (state: AppState) => {
  return getBaseState(state).systemAppearance
}

const selectHarmonyTheme = (state: AppState) => {
  const theme = getTheme(state)
  const systemAppearance = getSystemAppearance(state)

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
