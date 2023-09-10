import type { ReactNode } from 'react'
import { useEffect } from 'react'

import type { Nullable } from '@audius/common'
import { SystemAppearance, Theme, themeActions } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAppState } from '@react-native-community/hooks'
import { useDarkMode } from 'react-native-dynamic'
import { useDispatch } from 'react-redux'
import { useAsync } from 'react-use'

import { THEME_STORAGE_KEY } from 'app/constants/storage-keys'

const { setTheme, setSystemAppearance } = themeActions

type ThemeProviderProps = {
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children } = props
  const isDarkMode = useDarkMode()
  const dispatch = useDispatch()
  const appState = useAppState()

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

  return <>{children}</>
}
