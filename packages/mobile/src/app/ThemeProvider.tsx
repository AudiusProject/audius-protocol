import type { ReactNode } from 'react'
import { useEffect } from 'react'

import type { Nullable } from '@audius/common'
import {
  SystemAppearance,
  Theme,
  themeActions,
  themeSelectors
} from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAppState } from '@react-native-community/hooks'
import { useDarkMode } from 'react-native-dynamic'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony-native'
import { THEME_STORAGE_KEY } from 'app/constants/storage-keys'
import type { AppState } from 'app/store'

const { getTheme, getSystemAppearance } = themeSelectors
const { setTheme, setSystemAppearance } = themeActions

type ThemeProviderProps = {
  children: ReactNode
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

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children } = props
  const isDarkMode = useDarkMode()
  const dispatch = useDispatch()
  const appState = useAppState()
  const theme = useSelector(selectHarmonyTheme)

  useAsync(async () => {
    const savedTheme = (await AsyncStorage.getItem(
      THEME_STORAGE_KEY
    )) as Nullable<Theme>

    dispatch(setTheme({ theme: savedTheme ?? Theme.DEFAULT }))
  }, [dispatch])

  useEffect(() => {
    // react-native-dynamic incorrectly sets dark-mode when in background
    if (appState === 'active') {
      dispatch(
        setSystemAppearance({
          systemAppearance: isDarkMode
            ? SystemAppearance.DARK
            : SystemAppearance.LIGHT
        })
      )
    }
  }, [isDarkMode, dispatch, appState])

  return (
    <HarmonyThemeProvider themeName={theme}>{children}</HarmonyThemeProvider>
  )
}
